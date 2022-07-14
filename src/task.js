/*
 * task.js
 */

const { spawn } = require('node:child_process')
const { parseArgsStringToArgv } = require('string-argv')
const config = require('./config')

const activeTasks = {}

class Task {
  static list() {
    return Object.values(activeTasks).map(task => task.status())
  }

  static start(name) {
    if (name in activeTasks) {
      throw new Error('Task already running')
    }
    console.log(config)
    const description = config.get(name)
    console.log(description)
    const argv = parseArgsStringToArgv(description.command)
    const command = argv.shift()

    const args = [name, command, argv, description.options]
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
    return true
  }

  static status() {
    const task = activeTasks[name]
    if (!task)
      throw new Error('Task not running')
    task.kill()
    return task.status()
  }

  static logs(name) {
    const task = activeTasks[name]
    if (!task)
      throw new Error('Task not running')
    task.kill()
    return task.buffer
  }

  static stopAll(name) {
    Object.keys(activeTasks).forEach(name => {
      const task = activeTasks[name]
      task.kill('SIGKILL')
    })
    return true
  }

  constructor(name, command, args, options) {
    this.args = [name, command, args, options]
    this.startedAt = new Date()
    this.stoppedAt = null
    this.process = spawn(command, args, options)
    this.stdout = ''
    this.stderr = ''
    this.buffer = ''

    this.process.stdout.on('data', (data) => {
      this.stdout += data.toString()
      this.buffer += data.toString()
    })

    this.process.stderr.on('data', (data) => {
      this.stderr += data.toString()
      this.buffer += data.toString()
    })

    this.process.on('close', (code) => {
      console.log(`child process exited with code ${code}`)
      delete activeTasks[name]
      this.stoppedAt = new Date()
    })
  }

  status() {
    return {
      name:    this.args[0],
      command: this.args[1],
      args:    this.args[2],
      options: this.args[3],
      createdAt: this.createdAt,
    }
  }

  kill(signal) {
    this.process.kill(signal)
  }
}

module.exports = Task
