#!/usr/bin/env node
import { program } from 'commander'
import chalk from 'chalk'
import Table from 'tty-table'
import client from './client'

const commands = {} as Record<string, ((...args: any[]) => Promise<void>)>
Object.keys(client).forEach(key => {
  commands[key] = async (...args) => {
    const result = (await client[key](...args)) ?? ({ ok: false, message: 'No response received' })

    let message: string
    if (Array.isArray(result.message)) {
      const table = Table(
        result.message.length === 0 ? [] : Object.keys(result.message[0]).map(key => ({
          value: key,
          headerColor: 'white',
        })),
        result.message.length === 0 ? [['Empty list']] : result.message
      )
      message = '\n' + table.render() + '\n'
    }
    else if (typeof result.message === 'object' && result.message !== null) {
      const keys = Object.keys(result.message).map(key => ({
        value: key,
        headerColor: 'white',
      }))
      const table = Table(
        keys as any,
        [Object.values(result.message).map(value => JSON.stringify(value, null, '  '))]
      )

      message = '\n' + table.render() + '\n'
    }
    else {
      message = String(result.message).trim()
    }

    if (result.ok) {
      console.log(chalk.whiteBright('Command: ') + chalk.bold(key))
      console.log(chalk.whiteBright('Message: ') + chalk.bold.green(message))
    } else {
      console.error(chalk.whiteBright('Command: ') + chalk.bold(key))
      console.error(chalk.whiteBright('Message: ') + chalk.bold.red(message))
    }
  }
})

program
    .command('daemon-start')
    .action(commands.daemonStart)
program
    .command('daemon-stop')
    .action(commands.daemonStop)
program
    .command('daemon-status')
    .action(commands.daemonStatus)

program
    .command('set')
    .option('-c, --cwd', 'Use the current directory as the command\'s working directory.')
    .argument('<name>')
    .argument('<command>')
    .action(commands.set)
program
    .command('get')
    .argument('<name>')
    .action(commands.get)

program
    .command('list')
    .action(commands.list)
program
    .command('start')
    .argument('<name>')
    .action(commands.start)
program
    .command('stop')
    .argument('<name>')
    .action(commands.stop)
program
    .command('restart')
    .argument('<name>')
    .action(commands.restart)
program
    .command('status')
    .argument('<name>')
    .action(commands.status)
program
    .command('logs')
    .argument('<name>')
    .action(commands.logs)

program.parse()
