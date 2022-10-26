"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = exports.set = exports.write = exports.read = exports.LOG_FILE = exports.CONFIG_FILE = void 0;
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mkdirp_1 = __importDefault(require("mkdirp"));
const paths = {
    config: process.platform === 'linux' ?
        path_1.default.join(os_1.default.homedir(), '.config/pxm') :
        process.platform === 'darwin' ?
            path_1.default.join(os_1.default.homedir(), 'Library/Preferences/pxm') :
            process.exit(2)
};
mkdirp_1.default.sync(paths.config);
exports.CONFIG_FILE = path_1.default.join(paths.config, 'config.json');
exports.LOG_FILE = path_1.default.join(paths.config, 'out.log');
// Format:
//
// {
//   tasks: {
//     jenkins: {
//       command: 'ssh -N jenkins',
//     }
//   }
// }
//
const DEFAULT_CONFIG = {
    tasks: {},
};
function read() {
    try {
        return JSON.parse(fs_1.default.readFileSync(exports.CONFIG_FILE).toString());
    }
    catch (e) {
        if (e.code === 'ENOENT')
            return DEFAULT_CONFIG;
        throw e;
    }
}
exports.read = read;
function write(content) {
    fs_1.default.writeFileSync(exports.CONFIG_FILE, JSON.stringify(content));
}
exports.write = write;
function set(task, value) {
    const config = read();
    config.tasks[task] = value;
    write(config);
}
exports.set = set;
function get(task) {
    const config = read();
    const result = config.tasks[task];
    if (result === undefined)
        throw new Error('No task with that name');
    return result;
}
exports.get = get;
//# sourceMappingURL=config.js.map