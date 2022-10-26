import notifier from 'node-notifier'
import { spawn, ChildProcess, SpawnOptions } from 'node:child_process'
import { parseArgsStringToArgv } from 'string-argv'
import ControllablePromise from 'controllable-promise'
import * as config from './config'

const activeTasks = {} as Record<string, Task>

process.on('uncaughtException', (err: NodeJS.ErrnoException) => {
  if (err.code === 'ENOENT')
    return
  throw err
})

export default class Task {
  static list() {
    return Object.values(activeTasks).map(task => task.status())
  }

  static async start(name: string) {
    if (name in activeTasks)
      throw new Error('Task already running')

    const description = config.get(name)
    const argv = parseArgsStringToArgv(description.command)
    const command = argv.shift()

    const args = [name, command, argv, description.options]
    console.log('[task]', args)

    const task = new Task(name, command, argv, description.options)
    activeTasks[name] = task
    await task.didStart

    return { command, status: 'spawned' }
  }

  static stop(name: string) {
    const task = activeTasks[name]
    if (!task)
      throw new Error('Task not running')
    task.kill()
    return true
  }

  static async restart(name: string) {
    const task = activeTasks[name]
    if (!task)
      throw new Error('Task not running')
    await task.kill()
    Task.start(name)
    await activeTasks[name].didStart
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
  stoppedAt: Date | null
  process: ChildProcess
  stdout: string
  stderr: string
  buffer: string
  canNotify: boolean
  didRequestKill: boolean
  didStart: ControllablePromise<void>
  didEnd: ControllablePromise<number>

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
    this.canNotify = false
    this.didRequestKill = false
    this.didStart = new ControllablePromise()
    this.didEnd = new ControllablePromise()

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
      this.didEnd.resolve(code)
      if (!this.didRequestKill && this.canNotify)
        notifier.notify({
          title: 'pxm',
          message: `Task "${this.args[0]}" stopped.\nMessage: ${this.buffer.slice(0, 512)}`,
        })
    })

    this.process.on('error', err => {
      this.didStart.reject(err)
      this.didEnd.reject(err)
    })

    setTimeout(() => {
      if (this.stoppedAt === null) {
        this.didStart.resolve()
        this.canNotify = true
      } else {
        this.didStart.reject(new Error(this.stderr))
      }
    }, 500)
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
    return this.didEnd
  }
}
