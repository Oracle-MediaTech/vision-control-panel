"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = start;
exports.stop = stop;
exports.restart = restart;
exports.getStatus = getStatus;
exports.streamLogs = streamLogs;
exports.deletePm2 = deletePm2;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const ECOSYSTEM_PATH = path_1.default.join(__dirname, '..', '..', 'ecosystem.config.js');
function getPm2Bin() {
    return 'pm2';
}
function runPm2(args, options = {}) {
    return new Promise((resolve, reject) => {
        const child = (0, child_process_1.spawn)(getPm2Bin(), args, {
            shell: true,
            cwd: options.cwd || path_1.default.join(__dirname, '..', '..'),
            env: { ...process.env },
        });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (data) => {
            stdout += data.toString();
            if (options.onLog)
                options.onLog(data.toString());
        });
        child.stderr.on('data', (data) => {
            stderr += data.toString();
            if (options.onLog)
                options.onLog(data.toString());
        });
        child.on('close', (code) => {
            if (code === 0) {
                resolve(stdout);
            }
            else {
                reject(new Error(stderr || `PM2 exited with code ${code}`));
            }
        });
        child.on('error', reject);
    });
}
async function start() {
    await runPm2(['start', ECOSYSTEM_PATH]);
}
async function stop() {
    await runPm2(['stop', 'all']);
}
async function restart() {
    try {
        await runPm2(['restart', 'all']);
    }
    catch {
        await start();
    }
}
async function getStatus() {
    try {
        const output = await runPm2(['jlist']);
        const processes = JSON.parse(output);
        const proc = processes.find((p) => p.name === 'vfc-backend');
        if (!proc) {
            return { running: false, pid: null, uptime: 0, memory: 0, restarts: 0 };
        }
        return {
            running: proc.pm2_env.status === 'online',
            pid: proc.pid,
            uptime: proc.pm2_env.pm_uptime || 0,
            memory: proc.monit?.memory || 0,
            restarts: proc.pm2_env.restart_time || 0,
            status: proc.pm2_env.status,
        };
    }
    catch {
        return { running: false, pid: null, uptime: 0, memory: 0, restarts: 0 };
    }
}
function streamLogs(onLine) {
    const child = (0, child_process_1.spawn)(getPm2Bin(), ['logs', 'vfc-backend', '--raw', '--lines', '50'], {
        shell: true,
        cwd: path_1.default.join(__dirname, '..', '..'),
    });
    const processData = (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
            if (line.trim())
                onLine(line);
        }
    };
    child.stdout.on('data', processData);
    child.stderr.on('data', processData);
    child.on('error', (err) => {
        onLine(`[Error] ${err.message}`);
    });
    return child;
}
async function deletePm2() {
    try {
        await runPm2(['delete', 'vfc-backend']);
    }
    catch {
        // Process may not exist, ignore
    }
}
//# sourceMappingURL=pm2-manager.js.map