#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const tty_table_1 = __importDefault(require("tty-table"));
const client_1 = __importDefault(require("./client"));
const commands = {};
Object.keys(client_1.default).forEach(key => {
    commands[key] = (...args) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const result = (_a = (yield client_1.default[key](...args))) !== null && _a !== void 0 ? _a : ({ ok: false, message: 'No response received' });
        let message;
        if (Array.isArray(result.message)) {
            const table = (0, tty_table_1.default)(result.message.length === 0 ? [] : Object.keys(result.message[0]).map(key => ({
                value: key,
                headerColor: 'white',
            })), result.message.length === 0 ? [['Empty list']] : result.message);
            message = '\n' + table.render() + '\n';
        }
        else if (typeof result.message === 'object' && result.message !== null) {
            const keys = Object.keys(result.message).map(key => ({
                value: key,
                headerColor: 'white',
            }));
            const table = (0, tty_table_1.default)(keys, [Object.values(result.message).map(value => JSON.stringify(value, null, '  '))]);
            message = '\n' + table.render() + '\n';
        }
        else {
            message = String(result.message).trim();
        }
        if (result.ok) {
            console.log(chalk_1.default.whiteBright('Command: ') + chalk_1.default.bold(key));
            console.log(chalk_1.default.whiteBright('Message: ') + chalk_1.default.bold.green(message));
        }
        else {
            console.error(chalk_1.default.whiteBright('Command: ') + chalk_1.default.bold(key));
            console.error(chalk_1.default.whiteBright('Message: ') + chalk_1.default.bold.red(message));
        }
    });
});
commander_1.program
    .command('daemon-start')
    .action(commands.daemonStart);
commander_1.program
    .command('daemon-stop')
    .action(commands.daemonStop);
commander_1.program
    .command('daemon-status')
    .action(commands.daemonStatus);
commander_1.program
    .command('set')
    .option('-c, --cwd', 'Use the current directory as the command\'s working directory.')
    .argument('<name>')
    .argument('<command>')
    .action(commands.set);
commander_1.program
    .command('get')
    .argument('<name>')
    .action(commands.get);
commander_1.program
    .command('list')
    .action(commands.list);
commander_1.program
    .command('start')
    .argument('<name>')
    .action(commands.start);
commander_1.program
    .command('stop')
    .argument('<name>')
    .action(commands.stop);
commander_1.program
    .command('restart')
    .argument('<name>')
    .action(commands.restart);
commander_1.program
    .command('status')
    .argument('<name>')
    .action(commands.status);
commander_1.program
    .command('logs')
    .argument('<name>')
    .action(commands.logs);
commander_1.program.parse();
//# sourceMappingURL=index.js.map