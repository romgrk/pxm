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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const net_1 = __importDefault(require("net"));
const task_1 = __importDefault(require("./task"));
const config = __importStar(require("./config"));
const utils_1 = require("./utils");
const commands = {
    list: task_1.default.list,
    start: task_1.default.start,
    stop: task_1.default.stop,
    restart: task_1.default.restart,
    status: task_1.default.status,
    logs: task_1.default.logs,
    get: config.get,
    set: config.set,
    running: () => true,
    shutdown: () => {
        task_1.default.stopAll();
        setTimeout(() => process.exit(0), 5000);
        return true;
    },
};
if (require.main === module)
    server();
function server(...args) {
    const server = new net_1.default.Server();
    server.listen(utils_1.SOCKETFILE, () => {
        console.log(`Listening on ${utils_1.SOCKETFILE}`);
    });
    server.on('error', (e) => {
        if (e.code == 'EADDRINUSE') {
            const clientSocket = new net_1.default.Socket();
            clientSocket.on('error', (e) => {
                if (e.code == 'ECONNREFUSED') { // No other server listening
                    fs_1.default.unlinkSync(utils_1.SOCKETFILE);
                    server.listen(utils_1.SOCKETFILE, () => {
                        console.log('Server recovered');
                    });
                }
            });
            clientSocket.connect({ path: utils_1.SOCKETFILE }, function () {
                console.log('Server already running, exiting.');
                process.exit(0);
            });
        }
        else {
            console.error(e);
            process.exit(1);
        }
    });
    server.on('connection', socket => {
        console.log('[connection] new');
        socket.on('data', chunk => {
            const content = chunk.toString();
            console.log(`[connection] data: ${content}`);
            try {
                const request = JSON.parse(content);
                const result = commands[request.command](...request.args);
                socket.write(JSON.stringify({ ok: true, message: result }));
            }
            catch (e) {
                socket.write(JSON.stringify({
                    ok: false,
                    message: e.message,
                    stack: e.stack,
                    content,
                }));
            }
        });
        socket.on('end', () => {
            console.log('[connection] closed');
        });
    });
    process.on('exit', () => {
        server.close();
    });
}
//# sourceMappingURL=daemon.js.map