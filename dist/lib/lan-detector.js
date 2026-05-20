"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLanIP = getLanIP;
exports.getURLs = getURLs;
const os_1 = __importDefault(require("os"));
function getLanIP() {
    const interfaces = os_1.default.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}
function getURLs(port = 3030) {
    const ip = getLanIP();
    return {
        ip,
        port,
        admin: `http://${ip}:${port}/admin`,
        terminal: `http://${ip}:${port}/terminal`,
        api: `http://${ip}:${port}/api/v1`,
    };
}
//# sourceMappingURL=lan-detector.js.map