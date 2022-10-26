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
exports.default = {
    daemonStart: daemonStart,
    daemonStop: () => { send({ command: 'shutdown', args: [] }); },
    daemonStatus: () => { send({ command: 'running', args: [] }); },
    // Tasks
    list: () => { send({ command: 'list', args: [] }); },
    start: (name) => { send({ command: 'start', args: [name] }); },
    stop: (name) => { send({ command: 'stop', args: [name] }); },
    restart: (name) => { send({ command: 'restart', args: [name] }); },
    status: (name) => { send({ command: 'status', args: [name] }); },
    logs: (name) => { send({ command: 'logs', args: [name] }); },
    // Config
    get: wrap((name) => { return config.get(name); }),
    set: wrap((name, command, opts) => {
        const task = {
            command,
            options: {
                cwd: opts.cwd ? process.cwd() : undefined,
            },
        };
        config.set(name, task);
        return task;
    }),
};
function daemonStart() {
    return __awaiter(this, void 0, void 0, function* () {
        const out = fs_1.default.openSync(config.LOG_FILE, 'w');
        const err = fs_1.default.openSync(config.LOG_FILE, 'w');
        let buffer = '';
        let didClose = false;
        const child = child_process_1.default.spawn('node', [path_1.default.join(__dirname, 'daemon.js')], {
            detached: true,
            stdio: ['ignore', out, err]
        });
        child.unref();
        // child.stdout.on('data', data => { buffer += data.toString() })
        // child.stderr.on('data', data => { buffer += data.toString() })
        child.on('close', () => { didClose = true; });
        yield (0, utils_1.wait)(1000);
        if (didClose) {
            console.log({ ok: false, message: buffer });
        }
        else {
            console.log({ ok: true, message: buffer });
        }
    });
}
// Helpers
function wrap(fn) {
    return (...args) => __awaiter(this, void 0, void 0, function* () {
        try {
            console.log({ ok: true, message: yield fn(...args) });
        }
        catch (e) {
            console.error({ ok: false, message: e.message });
        }
    });
}
function send(content) {
    try {
        const client = net_1.default.createConnection(utils_1.SOCKETFILE);
        client.on('connect', () => {
            client.write(JSON.stringify(content));
            client.end();
        });
        client.on('data', data => {
            const response = JSON.parse(data.toString());
            console.log(response);
        });
        client.on('error', error => {
            console.error(error);
        });
    }
    catch (e) {
        console.error(e);
    }
}
//# sourceMappingURL=client.js.map