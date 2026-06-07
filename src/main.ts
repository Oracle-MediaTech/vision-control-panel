import { app, BrowserWindow, ipcMain, IpcMainEvent, dialog } from 'electron';
import path from 'path';
import { ChildProcess } from 'child_process';
import * as pm2Manager from './lib/pm2-manager';
import * as deployManager from './lib/deploy-manager';
import * as dbManager from './lib/db-manager';
import * as envManager from './lib/env-manager';
import { getURLs } from './lib/lan-detector';

let mainWindow: BrowserWindow | null = null;
let logChild: ChildProcess | null = null;
let shuttingDown = false;

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

// Stop the backend PM2 process whenever the control panel is shutting down.
// Idempotent: safe to call from both `before-quit` and `window-all-closed`.
async function shutdownBackend(): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  if (logChild) {
    try { logChild.kill(); } catch {}
    logChild = null;
  }
  try {
    await pm2Manager.stop();
  } catch {
    // backend may already be stopped, or pm2 not reachable — nothing to do
  }
}

app.whenReady().then(() => {
  envManager.ensureEnvFile();
  createWindow();
});

// Block first quit attempt so we can stop the backend cleanly, then quit for real.
app.on('before-quit', (event) => {
  if (shuttingDown) return;
  event.preventDefault();
  shutdownBackend().finally(() => app.quit());
});

app.on('window-all-closed', () => {
  shutdownBackend().finally(() => app.quit());
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
ipcMain.on('deploy:start', (_event: IpcMainEvent, target?: deployManager.DeployTarget) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    deployManager.deploy(mainWindow.webContents, { target });
  }
});

ipcMain.on('deploy:continue', (_event: IpcMainEvent, fromStep: number, target?: deployManager.DeployTarget) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    deployManager.deploy(mainWindow.webContents, { target, startFromStep: fromStep });
  }
});

ipcMain.on('deploy:cancel', () => {
  deployManager.cancel();
});

// LAN Info
ipcMain.handle('lan:get-info', () => {
  return getURLs();
});

// Settings: env file (DATABASE_URL, JWT_SECRET, etc.) lives in userData
ipcMain.handle('settings:get-env', () => {
  return {
    path: envManager.getEnvPath(),
    content: envManager.readEnvFile(),
  };
});

ipcMain.handle('settings:save-env', (_event, content: string) => {
  try {
    envManager.writeEnvFile(content);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

// Database dump
ipcMain.handle('db:dump', async () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return { success: false, error: 'Window not available' };
  }
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Save database dump',
    defaultPath: dbManager.defaultDumpFilename(),
    filters: [{ name: 'SQL', extensions: ['sql'] }],
  });
  if (canceled || !filePath) {
    return { success: false, error: 'cancelled' };
  }
  try {
    const send = (line: string) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('db:dump-log', line);
      }
    };
    const result = await dbManager.dumpDatabase(filePath, send);
    return { success: true, filePath, bytes: result.bytes };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});
