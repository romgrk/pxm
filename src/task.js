/*
 * task.js
 */

const { spawn } = require('node:child_process')
const { parseArgsStringToArgv } = require('string-argv')
const config = require('./config')

const activeTasks = {}

class Task {
  static start(name) {
    if (name in activeTasks) {
      throw new Error('Task already running')
    }
    console.log(config)
    const description = config.get(name)
    console.log(description)
    const argv = parseArgsStringToArgv(description.command)
    const command = argv.shift()

    const args = [name, command, argv, {}]
    console.log('[task]', args)

    const task = new Task(...args)
    activeTasks[name] = task

    return { command, status: 'spawned' }
  }

  static stop(name) {
    const task = activeTasks[name]
    if (!task)
      throw new Error('Task not running')
    task.kill()
  }

  constructor(name, command, args, options) {
    this.process = spawn(command, args, options)
    this.stdout = ''
    this.stderr = ''

    this.process.stdout.on('data', (data) => {
      this.stdout += data.toString()
    })

    this.process.stderr.on('data', (data) => {
      this.stderr += data.toString()
    })

    this.process.on('close', (code) => {
      console.log(`child process exited with code ${code}`)
      delete activeTasks[name]
    })
  }

  stop() {
    this.process.kill()
  }
}

module.exports = Task
