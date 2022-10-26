"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wait = exports.SOCKETFILE = void 0;
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
exports.SOCKETFILE = path_1.default.join(os_1.default.tmpdir(), 'pxm.socket');
function wait(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    });
}
exports.wait = wait;
//# sourceMappingURL=utils.js.map