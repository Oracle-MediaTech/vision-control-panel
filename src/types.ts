export interface PM2Status {
  running: boolean;
  pid: number | null;
  uptime: number;
  memory: number;
  restarts: number;
  status?: string;
}

export interface LanInfo {
  ip: string;
  port: number;
  admin: string;
  terminal: string;
  api: string;
}

export interface DeployProgress {
  step: number;
  name: string;
  status: 'running' | 'done' | 'error';
  detail?: string;
}

export interface IpcResult {
  success: boolean;
  error?: string;
}

export interface RunPm2Options {
  cwd?: string;
  onLog?: (line: string) => void;
}
