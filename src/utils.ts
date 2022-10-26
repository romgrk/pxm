import os from 'os'
import path from 'path'

export const SOCKETFILE = path.join(os.tmpdir(), 'pxm.socket')

export function wait(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms)
  })
}
