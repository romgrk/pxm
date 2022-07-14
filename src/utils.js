/*
 * utils.js
 */

const os = require('os')
const path = require('path')

const SOCKETFILE = path.join(os.tmpdir(), 'pxm.socket')

function wait(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms)
  })
}

module.exports = {
  SOCKETFILE,
  wait,
}
