const path = require('path');
const fs = require('fs');

// __dirname is reliable whether loaded by Electron, PM2 daemon, or plain Node.
// In packaged mode the file sits at resources/ecosystem.config.js, sibling to
// resources/backend/. In dev it sits at vision-control-panel/ecosystem.config.js
// with vfc-backend/ as a sibling.
const packagedBackend = path.join(__dirname, 'backend');
const devBackend = path.resolve(__dirname, '..', 'vfc-backend');
const BACKEND_DIR = fs.existsSync(packagedBackend) ? packagedBackend : devBackend;

// Allow the Electron main process to redirect logs into userData (writable).
const LOG_DIR = process.env.VCP_LOG_DIR || path.join(BACKEND_DIR, 'logs');

module.exports = {
  apps: [{
    name: 'vfc-backend',
    script: path.join(BACKEND_DIR, 'dist/server.js'),
    cwd: BACKEND_DIR,
    watch: false,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 3000,
    env: {
      NODE_ENV: 'production',
      PORT: 3030,
    },
    error_file: path.join(LOG_DIR, 'pm2-error.log'),
    out_file: path.join(LOG_DIR, 'pm2-out.log'),
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }]
};
