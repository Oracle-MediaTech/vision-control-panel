"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const pm2Manager = __importStar(require("./lib/pm2-manager"));
const deployManager = __importStar(require("./lib/deploy-manager"));
const dbManager = __importStar(require("./lib/db-manager"));
const envManager = __importStar(require("./lib/env-manager"));
const lan_detector_1 = require("./lib/lan-detector");
let mainWindow = null;
let logChild = null;
let shuttingDown = false;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 950,
        height: 750,
        minWidth: 800,
        minHeight: 600,
        title: 'Vision Control Panel',
        webPreferences: {
            preload: path_1.default.join(__dirname, '..', 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    mainWindow.loadFile(path_1.default.join(__dirname, '..', 'renderer', 'dist', 'index.html'));
    mainWindow.on('closed', () => {
        mainWindow = null;
        if (logChild) {
            try {
                logChild.kill();
            }
            catch { }
            logChild = null;
        }
    });
}
// Stop the backend PM2 process whenever the control panel is shutting down.
// Idempotent: safe to call from both `before-quit` and `window-all-closed`.
async function shutdownBackend() {
    if (shuttingDown)
        return;
    shuttingDown = true;
    if (logChild) {
        try {
            logChild.kill();
        }
        catch { }
        logChild = null;
    }
    try {
        await pm2Manager.stop();
    }
    catch {
        // backend may already be stopped, or pm2 not reachable — nothing to do
    }
}
electron_1.app.whenReady().then(() => {
    envManager.ensureEnvFile();
    createWindow();
});
// Block first quit attempt so we can stop the backend cleanly, then quit for real.
electron_1.app.on('before-quit', (event) => {
    if (shuttingDown)
        return;
    event.preventDefault();
    shutdownBackend().finally(() => electron_1.app.quit());
});
electron_1.app.on('window-all-closed', () => {
    shutdownBackend().finally(() => electron_1.app.quit());
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0)
        createWindow();
});
// --- IPC Handlers ---
// PM2 Controls
electron_1.ipcMain.handle('pm2:start', async () => {
    try {
        await pm2Manager.start();
        return { success: true };
    }
    catch (err) {
        return { success: false, error: err.message };
    }
});
electron_1.ipcMain.handle('pm2:stop', async () => {
    try {
        await pm2Manager.stop();
        return { success: true };
    }
    catch (err) {
        return { success: false, error: err.message };
    }
});
electron_1.ipcMain.handle('pm2:restart', async () => {
    try {
        await pm2Manager.restart();
        return { success: true };
    }
    catch (err) {
        return { success: false, error: err.message };
    }
});
electron_1.ipcMain.handle('pm2:status', async () => {
    return await pm2Manager.getStatus();
});
// PM2 Log Streaming
electron_1.ipcMain.on('pm2:logs', (_event) => {
    if (logChild) {
        try {
            logChild.kill();
        }
        catch { }
    }
    logChild = pm2Manager.streamLogs((line) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('pm2:log-data', line);
        }
    });
});
electron_1.ipcMain.on('pm2:logs-stop', () => {
    if (logChild) {
        try {
            logChild.kill();
        }
        catch { }
        logChild = null;
    }
});
// Deploy
electron_1.ipcMain.on('deploy:start', (_event, target) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        deployManager.deploy(mainWindow.webContents, { target });
    }
});
electron_1.ipcMain.on('deploy:continue', (_event, fromStep, target) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        deployManager.deploy(mainWindow.webContents, { target, startFromStep: fromStep });
    }
});
electron_1.ipcMain.on('deploy:cancel', () => {
    deployManager.cancel();
});
// LAN Info
electron_1.ipcMain.handle('lan:get-info', () => {
    return (0, lan_detector_1.getURLs)();
});
// Settings: env file (DATABASE_URL, JWT_SECRET, etc.) lives in userData
electron_1.ipcMain.handle('settings:get-env', () => {
    return {
        path: envManager.getEnvPath(),
        content: envManager.readEnvFile(),
    };
});
electron_1.ipcMain.handle('settings:save-env', (_event, content) => {
    try {
        envManager.writeEnvFile(content);
        return { success: true };
    }
    catch (err) {
        return { success: false, error: err.message };
    }
});
// Database dump
electron_1.ipcMain.handle('db:dump', async () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
        return { success: false, error: 'Window not available' };
    }
    const { canceled, filePath } = await electron_1.dialog.showSaveDialog(mainWindow, {
        title: 'Save database dump',
        defaultPath: dbManager.defaultDumpFilename(),
        filters: [{ name: 'SQL', extensions: ['sql'] }],
    });
    if (canceled || !filePath) {
        return { success: false, error: 'cancelled' };
    }
    try {
        const send = (line) => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('db:dump-log', line);
            }
        };
        const result = await dbManager.dumpDatabase(filePath, send);
        return { success: true, filePath, bytes: result.bytes };
    }
    catch (err) {
        return { success: false, error: err.message };
    }
});
//# sourceMappingURL=main.js.map