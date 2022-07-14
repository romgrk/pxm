/*
 * start.js
 */

const fs = require('fs')
const net = require('net')
const path = require('path')
const util = require('util')
const cp = require('child_process')

const config = require('./config')
const { SOCKETFILE, wait } = require('./utils')

util.inspect.defaultOptions =  {
  depth: 5,
}

module.exports = {
  daemonStart: daemonStart,
  daemonStop:   () => { send({ command: 'shutdown', args: [] }) },
  daemonStatus: () => { send({ command: 'running', args: [] }) },

  // Tasks
  list:  ()              => { send({ command: 'list', args: [] }) },
  start: (name)          => { send({ command: 'start', args: [name] }) },
  stop:  (name)          => { send({ command: 'stop', args: [name] }) },
  restart: (name)        => { send({ command: 'restart', args: [name] }) },
  status: (name)         => { send({ command: 'status', args: [name] }) },
  logs: (name)           => { send({ command: 'logs', args: [name] }) },

  // Config
  get: wrap((name) => { return config.get(name) }),
  set: wrap((name, command, opts) => {

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
