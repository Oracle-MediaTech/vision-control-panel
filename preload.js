const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // PM2 controls (promise-based)
  pm2Start: () => ipcRenderer.invoke('pm2:start'),
  pm2Stop: () => ipcRenderer.invoke('pm2:stop'),
  pm2Restart: () => ipcRenderer.invoke('pm2:restart'),
  pm2Status: () => ipcRenderer.invoke('pm2:status'),

  // PM2 log streaming
  pm2StartLogs: () => ipcRenderer.send('pm2:logs'),
  pm2StopLogs: () => ipcRenderer.send('pm2:logs-stop'),
  onPm2Log: (callback) => {
    ipcRenderer.removeAllListeners('pm2:log-data');
    ipcRenderer.on('pm2:log-data', (_event, data) => callback(data));
  },

  // Deploy
  deployStart: (target) => ipcRenderer.send('deploy:start', target),
  deployContinue: (fromStep, target) => ipcRenderer.send('deploy:continue', fromStep, target),
  deployCancel: () => ipcRenderer.send('deploy:cancel'),
  onDeployProgress: (callback) => {
    ipcRenderer.removeAllListeners('deploy:progress');
    ipcRenderer.on('deploy:progress', (_event, data) => callback(data));
  },
  onDeployLog: (callback) => {
    ipcRenderer.removeAllListeners('deploy:log');
    ipcRenderer.on('deploy:log', (_event, data) => callback(data));
  },
  onDeployComplete: (callback) => {
    ipcRenderer.removeAllListeners('deploy:complete');
    ipcRenderer.on('deploy:complete', (_event, data) => callback(data));
  },

  // LAN info
  getLanInfo: () => ipcRenderer.invoke('lan:get-info'),

  // Settings (env file in userData)
  settingsGetEnv: () => ipcRenderer.invoke('settings:get-env'),
  settingsSaveEnv: (content) => ipcRenderer.invoke('settings:save-env', content),

  // Configuration API (structured)
  configurationLoad: () => ipcRenderer.invoke('configuration:load'),
  configurationSave: (config) => ipcRenderer.invoke('configuration:save', config),
  configurationImport: () => ipcRenderer.invoke('configuration:import'),
  configurationExport: (content) => ipcRenderer.invoke('configuration:export', content),
  configurationTestDatabase: (dbParts) => ipcRenderer.invoke('configuration:test-database', dbParts),

  // Database dump
  dbDump: () => ipcRenderer.invoke('db:dump'),
  onDbDumpLog: (callback) => {
    ipcRenderer.removeAllListeners('db:dump-log');
    ipcRenderer.on('db:dump-log', (_event, data) => callback(data));
  },

  // Cleanup
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
