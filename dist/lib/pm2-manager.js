"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPm2Bin = getPm2Bin;
exports.start = start;
exports.stop = stop;
exports.restart = restart;
exports.killDaemon = killDaemon;
exports.getStatus = getStatus;
exports.streamLogs = streamLogs;
exports.deletePm2 = deletePm2;
const electron_1 = require("electron");
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const env_manager_1 = require("./env-manager");
const node_runtime_1 = require("../utils/node-runtime");
const isPackaged = fs_1.default.existsSync(path_1.default.join(process.resourcesPath || '', 'backend'));
const ECOSYSTEM_PATH = isPackaged
    ? path_1.default.join(process.resourcesPath, 'ecosystem.config.js')
    : path_1.default.join(__dirname, '..', '..', 'ecosystem.config.js');
function getPm2Bin() {
    if (!electron_1.app.isPackaged) {
        return require.resolve("pm2/bin/pm2");
    }
    const pm2 = path_1.default.join(process.resourcesPath, "app.asar.unpacked", "node_modules", "pm2", "bin", "pm2");
    if (!fs_1.default.existsSync(pm2)) {
        throw new Error(`PM2 binary not found:\n${pm2}`);
    }
    return pm2;
}
// function runPm2(args: string[], options: RunPm2Options = {}): Promise<string> {
//   return new Promise((resolve, reject) => {
//     // const child = spawn(getPm2Bin(), args, {
//     //   shell: true,
//     //   cwd: options.cwd || path.dirname(ECOSYSTEM_PATH),
//     //   env: { ...process.env, ...getBackendEnv() },
//     // });
//     const child = spawn(
//       process.execPath,
//       [getPm2Bin(), ...args],
//       {
//         shell: false,
//         cwd: options.cwd || path.dirname(ECOSYSTEM_PATH),
//         env: {
//           ...process.env,
//           ...getBackendEnv(),
//         },
//       }
//     );
//     let stdout = '';
//     let stderr = '';
//     child.stdout.on('data', (data: Buffer) => {
//       stdout += data.toString();
//       if (options.onLog) options.onLog(data.toString());
//     });
//     child.stderr.on('data', (data: Buffer) => {
//       stderr += data.toString();
//       if (options.onLog) options.onLog(data.toString());
//     });
//     child.on('close', (code: number | null) => {
//       if (code === 0) {
//         resolve(stdout);
//       } else {
//         reject(new Error(stderr || `PM2 exited with code ${code}`));
//       }
//     });
//     child.on('error', reject);
//   });
// }
// `--update-env` forces PM2 to discard the daemon's cached env for this app
// and use whatever env we passed to the pm2 CLI invocation (see runPm2). Without
// it, subsequent restarts silently keep the env captured the first time the
// daemon spawned the app — which is exactly why edits to .env appeared to do
// nothing until the daemon was killed and re-started.
function runPm2(args, options = {}) {
    return new Promise((resolve, reject) => {
        const child = (0, child_process_1.spawn)((0, node_runtime_1.getNodeExecutable)(), [getPm2Bin(), ...args], {
            shell: false,
            cwd: options.cwd || path_1.default.dirname(ECOSYSTEM_PATH),
            env: {
                ...process.env,
                ...(0, env_manager_1.getBackendEnv)(),
            },
            windowsHide: true,
        });
        let stdout = "";
        let stderr = "";
        child.stdout.on("data", (data) => {
            const text = data.toString();
            stdout += text;
            options.onLog?.(text);
        });
        child.stderr.on("data", (data) => {
            const text = data.toString();
            stderr += text;
            options.onLog?.(text);
        });
        child.on("error", reject);
        child.on("close", (code) => {
            if (code === 0) {
                resolve(stdout);
            }
            else {
                reject(new Error(stderr || `PM2 exited with code ${code}`));
            }
        });
    });
}
async function start() {
    await runPm2(['start', ECOSYSTEM_PATH, '--update-env']);
}
async function stop() {
    await runPm2(['stop', 'vfc-backend']);
}
async function restart() {
    try {
        await runPm2(['restart', 'vfc-backend', '--update-env']);
    }
    catch {
        await start();
    }
}
/**
 * Kill the PM2 daemon entirely. Use this when env changes need to take effect
 * deterministically — `--update-env` covers app env on restart, but the daemon
 * itself caches a separate copy that influences how it forks child processes.
 * After this call, the next start() launches a fresh daemon with the current env.
 */
async function killDaemon() {
    try {
        await runPm2(['kill']);
    }
    catch {
        // Daemon may already be dead; nothing to do.
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
    const child = (0, child_process_1.spawn)((0, node_runtime_1.getNodeExecutable)(), [
        getPm2Bin(),
        'logs',
        'vfc-backend',
        '--raw',
        '--lines',
        '50',
    ], {
        shell: false,
        cwd: path_1.default.dirname(ECOSYSTEM_PATH),
        env: {
            ...process.env,
            ...(0, env_manager_1.getBackendEnv)(),
        },
        windowsHide: true,
    });
    const processData = (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
            if (line.trim()) {
                onLine(line);
            }
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