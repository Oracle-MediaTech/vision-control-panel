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

export interface ElectronAPI {
  pm2Start: () => Promise<IpcResult>;
  pm2Stop: () => Promise<IpcResult>;
  pm2Restart: () => Promise<IpcResult>;
  pm2Status: () => Promise<PM2Status>;
  pm2StartLogs: () => void;
  pm2StopLogs: () => void;
  onPm2Log: (callback: (line: string) => void) => void;
  deployStart: () => void;
  deployCancel: () => void;
  onDeployProgress: (callback: (data: DeployProgress) => void) => void;
  onDeployLog: (callback: (line: string) => void) => void;
  onDeployComplete: (callback: (data: { success: boolean; error?: string }) => void) => void;
  getLanInfo: () => Promise<LanInfo>;
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
