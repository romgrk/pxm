"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const node_notifier_1 = __importDefault(require("node-notifier"));
const node_child_process_1 = require("node:child_process");
const string_argv_1 = require("string-argv");
const controllable_promise_1 = __importDefault(require("controllable-promise"));
const config = __importStar(require("./config"));
const activeTasks = {};
process.on('uncaughtException', (err) => {
    if (err.code === 'ENOENT')
        return;
    throw err;
});
class Task {
    constructor(name, command, args, options) {
        this.args = [name, command, args, options];
        this.startedAt = new Date();
        this.stoppedAt = null;
        this.process = (0, node_child_process_1.spawn)(command, args, options);
        this.stdout = '';
        this.stderr = '';
        this.buffer = '';
        this.canNotify = false;
        this.didRequestKill = false;
        this.didStart = new controllable_promise_1.default();
        this.didEnd = new controllable_promise_1.default();
        this.process.stdout.on('data', (data) => {
            this.stdout += data.toString();
            this.buffer += data.toString();
        });
        this.process.stderr.on('data', (data) => {
            this.stderr += data.toString();
            this.buffer += data.toString();
        });
        this.process.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            delete activeTasks[name];
            this.stoppedAt = new Date();
            this.didEnd.resolve(code);
            if (!this.didRequestKill && this.canNotify)
                node_notifier_1.default.notify({
                    title: 'pxm',
                    message: `Task "${this.args[0]}" stopped.\nMessage: ${this.buffer.slice(0, 512)}`,
                });
        });
        this.process.on('error', err => {
            this.didStart.reject(err);
            this.didEnd.reject(err);
        });
        setTimeout(() => {
            if (this.stoppedAt === null) {
                this.didStart.resolve();
                this.canNotify = true;
            }
            else {
                this.didStart.reject(new Error(this.stderr));
            }
        }, 500);
    }
    static list() {
        return Object.values(activeTasks).map(task => task.status());
    }
    static start(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (name in activeTasks)
                throw new Error('Task already running');
            const description = config.get(name);
            const argv = (0, string_argv_1.parseArgsStringToArgv)(description.command);
            const command = argv.shift();
            const args = [name, command, argv, description.options];
            console.log('[task]', args);
            const task = new Task(name, command, argv, description.options);
            activeTasks[name] = task;
            yield task.didStart;
            return { command, status: 'spawned' };
        });
    }
    static stop(name) {
        const task = activeTasks[name];
        if (!task)
            throw new Error('Task not running');
        task.kill();
        return true;
    }
    static restart(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const task = activeTasks[name];
            if (!task)
                throw new Error('Task not running');
            yield task.kill();
            Task.start(name);
            yield activeTasks[name].didStart;
            return true;
        });
    }
    static status(name) {
        const task = activeTasks[name];
        if (!task)
            throw new Error('Task not running');
        return task.status();
    }
    static logs(name) {
        const task = activeTasks[name];
        if (!task)
            throw new Error('Task not running');
        return task.buffer;
    }
    static stopAll() {
        Object.keys(activeTasks).forEach(name => {
            const task = activeTasks[name];
            task.kill('SIGKILL');
        });
        return true;
    }
    status() {
        return {
            name: this.args[0],
            command: this.args[1],
            args: this.args[2],
            options: this.args[3],
            startedAt: this.startedAt,
        };
    }
    kill(signal) {
        this.didRequestKill = true;
        this.process.kill(signal);
        return this.didEnd;
    }
}
exports.default = Task;
//# sourceMappingURL=task.js.map