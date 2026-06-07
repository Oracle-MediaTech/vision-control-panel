import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { PM2Status, RunPm2Options } from '../types';
import { getBackendEnv } from './env-manager';

const isPackaged = fs.existsSync(path.join(process.resourcesPath || '', 'backend'));
const ECOSYSTEM_PATH = isPackaged
  ? path.join(process.resourcesPath!, 'ecosystem.config.js')
  : path.join(__dirname, '..', '..', 'ecosystem.config.js');

// Resolve pm2 from the app's own node_modules so the user does not need a
// global install. electron-builder unpacks pm2 outside the asar archive
// (see `asarUnpack` in package.json) — we check that location first.
function getPm2Bin(): string {
  const candidates = [
    path.join(process.resourcesPath ?? '', 'app.asar.unpacked', 'node_modules', 'pm2', 'bin', 'pm2'),
    path.join(__dirname, '..', '..', 'node_modules', 'pm2', 'bin', 'pm2'),
  ];
  const found = candidates.find((p) => fs.existsSync(p));
  return found ?? 'pm2'; // last-resort global
}

function runPm2(args: string[], options: RunPm2Options = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(getPm2Bin(), args, {
      shell: true,
      cwd: options.cwd || path.dirname(ECOSYSTEM_PATH),
      env: { ...process.env, ...getBackendEnv() },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
      if (options.onLog) options.onLog(data.toString());
    });

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
      if (options.onLog) options.onLog(data.toString());
    });

    child.on('close', (code: number | null) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(stderr || `PM2 exited with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

export async function start(): Promise<void> {
  await runPm2(['start', ECOSYSTEM_PATH]);
}

export async function stop(): Promise<void> {
  await runPm2(['stop', 'vfc-backend']);
}

export async function restart(): Promise<void> {
  try {
    await runPm2(['restart', 'vfc-backend']);
  } catch {
    await start();
  }
}

export async function getStatus(): Promise<PM2Status> {
  try {
    const output = await runPm2(['jlist']);
    const processes = JSON.parse(output);
    const proc = processes.find((p: any) => p.name === 'vfc-backend');

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
  } catch {
    return { running: false, pid: null, uptime: 0, memory: 0, restarts: 0 };
  }
}

export function streamLogs(onLine: (line: string) => void): ChildProcess {
  const child = spawn(getPm2Bin(), ['logs', 'vfc-backend', '--raw', '--lines', '50'], {
    shell: true,
    cwd: path.dirname(ECOSYSTEM_PATH),
    env: { ...process.env, ...getBackendEnv() },
  });

  const processData = (data: Buffer): void => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) onLine(line);
    }
  };

  child.stdout.on('data', processData);
  child.stderr.on('data', processData);

  child.on('error', (err: Error) => {
    onLine(`[Error] ${err.message}`);
  });

  return child;
}

export async function deletePm2(): Promise<void> {
  try {
    await runPm2(['delete', 'vfc-backend']);
  } catch {
    // Process may not exist, ignore
  }
}
