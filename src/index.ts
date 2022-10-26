#!/usr/bin/env node
import { program } from 'commander'
import client from './client'

program
    .command('daemon-start')
    .action(client.daemonStart)
program
    .command('daemon-stop')
    .action(client.daemonStop)
program
    .command('daemon-status')
    .action(client.daemonStatus)

program
    .command('set')
    .option('-c, --cwd', 'Use the current directory as the command\'s working directory.')
    .argument('<name>')
    .argument('<command>')
    .action(client.set)
program
    .command('get')
    .argument('<name>')
    .action(client.get)

program
    .command('list')
    .action(client.list)
program
    .command('start')
    .argument('<name>')
    .action(client.start)
program
    .command('stop')
    .argument('<name>')
    .action(client.stop)
program
    .command('restart')
    .argument('<name>')
    .action(client.restart)
program
    .command('status')
    .argument('<name>')
    .action(client.status)
program
    .command('logs')
    .argument('<name>')
    .action(client.logs)

program.parse()
