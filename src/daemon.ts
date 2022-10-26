import fs from 'fs'
import net from 'net'
import task from './task'
import * as config from './config'
import { SOCKETFILE } from './utils'

const commands = {
  list: task.list,
  start: task.start,
  stop: task.stop,
  restart: task.restart,
  status: task.status,
  logs: task.logs,

  get: config.get,
  set: config.set,

  daemonStatus: () => true,
  daemonStop: () => {
    task.stopAll()
    setTimeout(() => process.exit(0), 5000)
    return true
  },
}

if (require.main === module)
  daemon()

function daemon() {
  const server = new net.Server()

  server.listen(SOCKETFILE, () => {
    console.log(`Listening on ${SOCKETFILE}`)
  })

  server.on('error', (e: NodeJS.ErrnoException) => {
    if (e.code == 'EADDRINUSE') {
      const clientSocket = new net.Socket()

      clientSocket.on('error', (e: NodeJS.ErrnoException) => { // handle error trying to talk to server
        if (e.code == 'ECONNREFUSED') {  // No other server listening
          fs.unlinkSync(SOCKETFILE)
          server.listen(SOCKETFILE, () => { // 'listening' listener
            console.log('Server recovered')
          })
        }
      });
      clientSocket.connect({ path: SOCKETFILE }, function() { 
        console.log('Server already running, exiting.');
        process.exit(0)
      });
    } else {
      console.error(e)
      process.exit(1)
    }
  })

  server.on('connection', socket => {
    console.log('[connection] new')

    socket.on('data', async chunk => {
      const content = chunk.toString()

      console.log(`[connection] data: ${content}`)

      try {
        const request = JSON.parse(content)
        const result = await commands[request.command](...request.args)
        socket.write(JSON.stringify({ ok: true, message: result }))
      } catch(e) {
        socket.write(JSON.stringify({
          ok: false,
          message: e.message,
          stack: e.stack,
          content,
        }))
      }
    })

    socket.on('end', () => {
      console.log('[connection] closed')
    })
  })

  process.on('exit', () => {
    server.close()
  })
}
