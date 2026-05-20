const path = require('path');

module.exports = {
  apps: [
    {
      name: 'vfc-backend',
      script: path.resolve(__dirname, '../vfc-backend/dist/server.js'),
      cwd: path.resolve(__dirname, '../vfc-backend'),
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        NODE_ENV: 'production',
        PORT: 3030,
      },
      error_file: path.resolve(__dirname, '../vfc-backend/logs/pm2-error.log'),
      out_file: path.resolve(__dirname, '../vfc-backend/logs/pm2-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'vfc-admin',
      script: path.resolve(__dirname, '../vfc-frontend/.next/standalone/server.js'),
      cwd: path.resolve(__dirname, '../vfc-frontend/.next/standalone'),
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        NODE_ENV: 'production',
        PORT: 3031,
      },
      error_file: path.resolve(__dirname, '../vfc-frontend/logs/pm2-error.log'),
      out_file: path.resolve(__dirname, '../vfc-frontend/logs/pm2-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ]
};
