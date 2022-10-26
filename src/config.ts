import os from 'os'
import fs from 'fs'
import path from 'path'
import mkdirp from 'mkdirp'

const paths = {
  config:
    process.platform === 'linux' ?
      path.join(os.homedir(), '.config/pxm') :
    process.platform === 'darwin' ?
      path.join(os.homedir(), 'Library/Preferences/pxm') :
      process.exit(2)
}
mkdirp.sync(paths.config)

export const CONFIG_FILE = path.join(paths.config, 'config.json')
export const LOG_FILE    = path.join(paths.config, 'out.log')

// Format:
//
// {
//   tasks: {
//     jenkins: {
//       command: 'ssh -N jenkins',
//     }
//   }
// }
//

const DEFAULT_CONFIG = {
  tasks: {},
}

export function read() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE).toString())
  } catch(e) {
    if (e.code === 'ENOENT')
      return DEFAULT_CONFIG
    throw e
  }
}

export function write(content) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(content))
}

export function set(task, value) {
  const config = read()
  config.tasks[task] = value
  write(config)
}

export function get(task) {
  const config = read()
  const result = config.tasks[task]
  if (result === undefined)
    throw new Error('No task with that name')
  return result
}
