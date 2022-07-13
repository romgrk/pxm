/*
 * config.js
 */

const os = require('os')
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')

const paths = {
  config: path.join(os.homedir(), '.config/pxm')
}
mkdirp.sync(paths.config)

const CONFIG_FILE = path.join(paths.config, 'config.json')
const LOG_FILE    = path.join(paths.config, 'out.log')

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

function read() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE).toString())
  } catch(e) {
    if (e.code === 'ENOENT')
      return DEFAULT_CONFIG
    throw e
  }
}

function write(content) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(content))
}

function set(task, value) {
  const config = read()
  config.tasks[task] = value
  write(config)
}

function get(task) {
  const config = read()
  const result = config.tasks[task]
  if (result === undefined)
    throw new Error('No task with that name')
  return result
}

module.exports = {
  get,
  set,
  read,
  write,
  LOG_FILE,
  CONFIG_FILE,
}
