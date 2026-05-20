import { app, BrowserWindow, ipcMain, IpcMainEvent } from 'electron';
import path from 'path';
import { ChildProcess } from 'child_process';
import * as pm2Manager from './lib/pm2-manager';
import * as deployManager from './lib/deploy-manager';
import { getURLs } from './lib/lan-detector';

let mainWindow: BrowserWindow | null = null;
let logChild: ChildProcess | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 950,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    title: 'Vision Control Panel',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'dist', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (logChild) {
      try { logChild.kill(); } catch {}
      logChild = null;
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (logChild) {
    try { logChild.kill(); } catch {}
    logChild = null;
  }
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// --- IPC Handlers ---

// PM2 Controls
ipcMain.handle('pm2:start', async () => {
  try {
    await pm2Manager.start();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('pm2:stop', async () => {
  try {
    await pm2Manager.stop();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('pm2:restart', async () => {
  try {
    await pm2Manager.restart();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('pm2:status', async () => {
  return await pm2Manager.getStatus();
});

// PM2 Log Streaming
ipcMain.on('pm2:logs', (_event: IpcMainEvent) => {
  if (logChild) {
    try { logChild.kill(); } catch {}
  }
  logChild = pm2Manager.streamLogs((line: string) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('pm2:log-data', line);
    }
  });
});

ipcMain.on('pm2:logs-stop', () => {
  if (logChild) {
    try { logChild.kill(); } catch {}
    logChild = null;
  }
});

// Deploy
ipcMain.on('deploy:start', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    deployManager.deploy(mainWindow.webContents);
  }
});

ipcMain.on('deploy:cancel', () => {
  deployManager.cancel();
});

// LAN Info
ipcMain.handle('lan:get-info', () => {
  return getURLs();
});
