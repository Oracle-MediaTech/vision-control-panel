import os from 'os';
import { LanInfo } from '../types';

export function getLanIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

export function getURLs(port: number = 3030): LanInfo {
  const ip = getLanIP();
  return {
    ip,
    port,
    admin: `http://${ip}:${port}/admin`,
    terminal: `http://${ip}:${port}/terminal`,
    api: `http://${ip}:${port}/api/v1`,
  };
}
