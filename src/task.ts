import notifier from 'node-notifier'
import { spawn, ChildProcess, SpawnOptions } from 'node:child_process'
import { parseArgsStringToArgv } from 'string-argv'
import * as config from './config'

const activeTasks = {} as Record<string, Task>

export default class Task {
  static list() {
    return Object.values(activeTasks).map(task => task.status())
  }

  static start(name: string) {
    if (name in activeTasks) {
      throw new Error('Task already running')
    }
    const description = config.get(name)
    const argv = parseArgsStringToArgv(description.command)
    const command = argv.shift()

    const args = [name, command, argv, description.options]
    console.log('[task]', args)

    const task = new Task(name, command, argv, description.options)
    activeTasks[name] = task

    return { command, status: 'spawned' }
  }

  static stop(name: string) {
    const task = activeTasks[name]
    if (!task)
      throw new Error('Task not running')
    task.kill()
    return true
  }

  static restart(name: string) {
    const task = activeTasks[name]
    if (!task)
      throw new Error('Task not running')
    task.kill()
    Task.start(name)
    return true
  }

  static status(name: string) {
    const task = activeTasks[name]
    if (!task)
      throw new Error('Task not running')
    return task.status()
  }

  static logs(name: string) {
    const task = activeTasks[name]
    if (!task)
      throw new Error('Task not running')
    return task.buffer
  }

  static stopAll() {
    Object.keys(activeTasks).forEach(name => {
      const task = activeTasks[name]
      task.kill('SIGKILL')
    })
    return true
  }

  args: any[]
  startedAt: Date
  stoppedAt: Date
  process: ChildProcess
  stdout: string
  stderr: string
  buffer: string
  didRequestKill: boolean

  constructor(
    name: string,
    command: string,
    args: string[],
    options: SpawnOptions
  ) {
    this.args = [name, command, args, options]
    this.startedAt = new Date()
    this.stoppedAt = null
    this.process = spawn(command, args, options)
    this.stdout = ''
    this.stderr = ''
    this.buffer = ''
    this.didRequestKill = false

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
      if (!this.didRequestKill)
        notifier.notify({
          title: 'pxm',
          message: `Task "${this.args[0]}" stopped.`,
        })
    })
  }

  status() {
    return {
      name:    this.args[0],
      command: this.args[1],
      args:    this.args[2],
      options: this.args[3],
      startedAt: this.startedAt,
    }
  }

  kill(signal?: number | NodeJS.Signals) {
    this.didRequestKill = true
    this.process.kill(signal)
  }
}
