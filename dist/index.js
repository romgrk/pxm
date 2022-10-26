#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const client_1 = __importDefault(require("./client"));
commander_1.program
    .command('daemon-start')
    .action(client_1.default.daemonStart);
commander_1.program
    .command('daemon-stop')
    .action(client_1.default.daemonStop);
commander_1.program
    .command('daemon-status')
    .action(client_1.default.daemonStatus);
commander_1.program
    .command('set')
    .option('-c, --cwd')
    .argument('<name>')
    .argument('<command>')
    .action(client_1.default.set);
commander_1.program
    .command('get')
    .argument('<name>')
    .action(client_1.default.get);
commander_1.program
    .command('list')
    .action(client_1.default.list);
commander_1.program
    .command('start')
    .argument('<name>')
    .action(client_1.default.start);
commander_1.program
    .command('stop')
    .argument('<name>')
    .action(client_1.default.stop);
commander_1.program
    .command('restart')
    .argument('<name>')
    .action(client_1.default.restart);
commander_1.program
    .command('status')
    .argument('<name>')
    .action(client_1.default.status);
commander_1.program
    .command('logs')
    .argument('<name>')
    .action(client_1.default.logs);
commander_1.program.parse();
//# sourceMappingURL=index.js.map