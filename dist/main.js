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
const lan_detector_1 = require("./lib/lan-detector");
let mainWindow = null;
let logChild = null;
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
electron_1.app.whenReady().then(createWindow);
electron_1.app.on('window-all-closed', () => {
    if (logChild) {
        try {
            logChild.kill();
        }
        catch { }
        logChild = null;
    }
    electron_1.app.quit();
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
electron_1.ipcMain.on('deploy:start', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        deployManager.deploy(mainWindow.webContents);
    }
});
electron_1.ipcMain.on('deploy:continue', (_event, fromStep) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        deployManager.deploy(mainWindow.webContents, fromStep);
    }
});
electron_1.ipcMain.on('deploy:cancel', () => {
    deployManager.cancel();
});
// LAN Info
electron_1.ipcMain.handle('lan:get-info', () => {
    return (0, lan_detector_1.getURLs)();
});
//# sourceMappingURL=main.js.map