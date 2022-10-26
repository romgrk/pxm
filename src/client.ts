/*
 * start.js
 */

import fs from 'fs'
import net from 'net'
import path from 'path'
import util from 'util'
import cp, { SpawnOptions } from 'child_process'

import * as config from './config'
import { SOCKETFILE, wait } from './utils'

util.inspect.defaultOptions =  {
  depth: 5,
}

export default {
  daemonStart: daemonStart,
  daemonStop:   () => { send({ command: 'shutdown', args: [] }) },
  daemonStatus: () => { send({ command: 'running', args: [] }) },

  // Tasks
  list:  ()              => { send({ command: 'list', args: [] }) },
  start: (name: string)          => { send({ command: 'start', args: [name] }) },
  stop:  (name: string)          => { send({ command: 'stop', args: [name] }) },
  restart: (name: string)        => { send({ command: 'restart', args: [name] }) },
  status: (name: string)         => { send({ command: 'status', args: [name] }) },
  logs: (name: string)           => { send({ command: 'logs', args: [name] }) },

  // Config
  get: wrap((name: string) => { return config.get(name) }),
  set: wrap((name: string, command: string, opts: SpawnOptions) => {

    const task = {
      command,
      options: {
        cwd: opts.cwd ? process.cwd() : undefined,
      },
    }

    config.set(name, task)

    return task
  }),
}

async function daemonStart() {
  const out = fs.openSync(config.LOG_FILE, 'w')
  const err = fs.openSync(config.LOG_FILE, 'w')

  let buffer = ''
  let didClose = false

  const child = cp.spawn('node', [path.join(__dirname, 'daemon.js')], {
    detached: true,
    stdio: ['ignore', out, err]
  })
  child.unref()

  // child.stdout.on('data', data => { buffer += data.toString() })
  // child.stderr.on('data', data => { buffer += data.toString() })
  child.on('close', () => { didClose = true })

  await wait(1000)

  if (didClose) {
    console.log({ ok: false, message: buffer })
  } else {
    console.log({ ok: true, message: buffer })
  }
}


// Helpers

function wrap(fn) {
  return async (...args) => {
    try {
      console.log({ ok: true, message: await fn(...args) })
    } catch(e) {
      console.error({ ok: false, message: e.message })
    }
  }
}

function send(content) {
  try {
    const client = net.createConnection(SOCKETFILE)

    client.on('connect', () => {
      client.write(JSON.stringify(content))
      client.end()
    })

    client.on('data', data => {
      const response = JSON.parse(data.toString())
      console.log(response)
    })

    client.on('error', error => {
      console.error(error)
    })
  } catch(e) {
    console.error(e)
  }
}
