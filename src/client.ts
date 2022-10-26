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

type CommandCall = {
  command: string,
  args: any[],
}

type Message<T = any> =
  Promise<{
    ok: boolean,
    message: T,
  }>

const commands = {
  daemonStart: daemonStart,
  daemonStop:   () =>
    send({ command: 'daemonStop', args: [] })
    .catch(() => ({ ok: true, message: true })) as Message<boolean>,
  daemonStatus: () =>
    send({ command: 'daemonStatus',  args: [] })
    .catch(() => ({ ok: false, message: false })) as Message<boolean>,

  // Tasks
  list:  ()               => startAndSend({ command: 'list',    args: [] }),
  start: (name: string)   => startAndSend({ command: 'start',   args: [name] }),
  stop:  (name: string)   => startAndSend({ command: 'stop',    args: [name] }),
  restart: (name: string) => startAndSend({ command: 'restart', args: [name] }),
  status: (name: string)  => startAndSend({ command: 'status',  args: [name] }),
  logs: (name: string)    => startAndSend({ command: 'logs',    args: [name] }),

  // Config
  get: wrap((name: string) => {
    const task = config.get(name)
    return { name, ...task }
  }),
  set: wrap((name: string, command: string, opts: SpawnOptions) => {
    const task = {
      command,
      options: {
        cwd: opts.cwd ? process.cwd() : undefined,
      },
    }

    config.set(name, task)

    return { name, ...task }
  }),
}

export default commands

async function daemonStart() {
  const out = fs.openSync(config.LOG_FILE, 'w')
  const err = fs.openSync(config.LOG_FILE, 'w')

  let didClose = false

  const child = cp.spawn('node', [path.join(__dirname, '../dist/daemon.js')], {
    detached: true,
    stdio: ['ignore', out, err]
  })
  child.unref()

  // let buffer = ''
  // child.stdout.on('data', data => { buffer += data.toString() })
  // child.stderr.on('data', data => { buffer += data.toString() })
  child.on('close', () => { didClose = true })

  await wait(500)

  const buffer = fs.readFileSync(config.LOG_FILE).toString()
  if (didClose) {
    return { ok: false, message: buffer }
  } else {
    return { ok: true, message: buffer }
  }
}


// Helpers

function wrap(fn) {
  return async (...args) => {
    try {
      return { ok: true, message: await fn(...args) }
    } catch(e) {
      return { ok: false, message: e.message }
    }
  }
}

async function send(content: CommandCall) {
  return new Promise((resolve, reject) => {
    try {
      const client = net.createConnection(SOCKETFILE)

      client.on('connect', () => {
        client.write(JSON.stringify(content))
        client.end()
      })

      client.on('data', data => {
        const response = JSON.parse(data.toString())
        resolve(response)
      })

      client.on('close', () => {
        resolve(undefined)
      })

      client.on('error', error => {
        reject(error)
      })
    } catch(e) {
      reject(e)
    }
  })
}

async function startAndSend(content: CommandCall) {
  const result = await commands.daemonStatus()
  const isRunning = result.message
  if (!isRunning)
    await commands.daemonStart()
  return send(content)
}
