"use strict";
/*
 * start.js
 */
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
const fs_1 = __importDefault(require("fs"));
const net_1 = __importDefault(require("net"));
const path_1 = __importDefault(require("path"));
const util_1 = __importDefault(require("util"));
const child_process_1 = __importDefault(require("child_process"));
const config = __importStar(require("./config"));
const utils_1 = require("./utils");
util_1.default.inspect.defaultOptions = {
    depth: 5,
};
const commands = {
    daemonStart: daemonStart,
    daemonStop: () => send({ command: 'daemonStop', args: [] })
        .catch(() => ({ ok: true, message: true })),
    daemonStatus: () => send({ command: 'daemonStatus', args: [] })
        .catch(() => ({ ok: false, message: false })),
    // Tasks
    list: () => startAndSend({ command: 'list', args: [] }),
    start: (name) => startAndSend({ command: 'start', args: [name] }),
    stop: (name) => startAndSend({ command: 'stop', args: [name] }),
    restart: (name) => startAndSend({ command: 'restart', args: [name] }),
    status: (name) => startAndSend({ command: 'status', args: [name] }),
    logs: (name) => startAndSend({ command: 'logs', args: [name] }),
    // Config
    get: wrap((name) => {
        const task = config.get(name);
        return Object.assign({ name }, task);
    }),
    set: wrap((name, command, opts) => {
        const task = {
            command,
            options: {
                cwd: opts.cwd ? process.cwd() : undefined,
            },
        };
        config.set(name, task);
        return Object.assign({ name }, task);
    }),
};
exports.default = commands;
function daemonStart() {
    return __awaiter(this, void 0, void 0, function* () {
        const out = fs_1.default.openSync(config.LOG_FILE, 'w');
        const err = fs_1.default.openSync(config.LOG_FILE, 'w');
        let didClose = false;
        const child = child_process_1.default.spawn('node', [path_1.default.join(__dirname, '../dist/daemon.js')], {
            detached: true,
            stdio: ['ignore', out, err]
        });
        child.unref();
        // let buffer = ''
        // child.stdout.on('data', data => { buffer += data.toString() })
        // child.stderr.on('data', data => { buffer += data.toString() })
        child.on('close', () => { didClose = true; });
        yield (0, utils_1.wait)(500);
        const buffer = fs_1.default.readFileSync(config.LOG_FILE).toString();
        if (didClose) {
            return { ok: false, message: buffer };
        }
        else {
            return { ok: true, message: buffer };
        }
    });
}
// Helpers
function wrap(fn) {
    return (...args) => __awaiter(this, void 0, void 0, function* () {
        try {
            return { ok: true, message: yield fn(...args) };
        }
        catch (e) {
            return { ok: false, message: e.message };
        }
    });
}
function send(content) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            try {
                const client = net_1.default.createConnection(utils_1.SOCKETFILE);
                client.on('connect', () => {
                    client.write(JSON.stringify(content));
                    client.end();
                });
                client.on('data', data => {
                    const response = JSON.parse(data.toString());
                    resolve(response);
                });
                client.on('close', () => {
                    resolve(undefined);
                });
                client.on('error', error => {
                    reject(error);
                });
            }
            catch (e) {
                reject(e);
            }
        });
    });
}
function startAndSend(content) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield commands.daemonStatus();
        const isRunning = result.message;
        if (!isRunning)
            yield commands.daemonStart();
        return send(content);
    });
}
//# sourceMappingURL=client.js.map