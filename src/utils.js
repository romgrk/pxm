/*
 * utils.js
 */

const os = require('os')
const path = require('path')

const SOCKETFILE = path.join(os.tmpdir(), 'pxm.socket')

module.exports = {
  SOCKETFILE,
}
