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
exports.deploy = deploy;
exports.cancel = cancel;
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const lan_detector_1 = require("./lan-detector");
const pm2Manager = __importStar(require("./pm2-manager"));
const BACKEND_DIR = path_1.default.resolve(__dirname, '../../../vfc-backend');
const FRONTEND_DIR = path_1.default.resolve(__dirname, '../../../vfc-frontend');
const PWA_DIR = path_1.default.resolve(__dirname, '../../../vision-attendance-pwa');
let activeChildren = [];
let cancelled = false;
function runCommand(cmd, args, cwd, onLog) {
    return new Promise((resolve, reject) => {
        const child = (0, child_process_1.spawn)(cmd, args, { shell: true, cwd, env: { ...process.env } });
        activeChildren.push(child);
        const processData = (data) => {
            const lines = data.toString().split('\n');
            for (const line of lines) {
                if (line.trim())
                    onLog(line.trim());
            }
        };
        child.stdout.on('data', processData);
        child.stderr.on('data', processData);
        child.on('close', (code) => {
            activeChildren = activeChildren.filter(c => c !== child);
            if (cancelled) {
                reject(new Error('Deploy cancelled'));
            }
            else if (code === 0) {
                resolve();
            }
            else {
                reject(new Error(`Command failed with exit code ${code}`));
            }
        });
        child.on('error', (err) => {
            activeChildren = activeChildren.filter(c => c !== child);
            reject(err);
        });
    });
}
function patchFrontendConfig(lanIP) {
    const frontendEnvPath = path_1.default.join(FRONTEND_DIR, '.env');
    fs_1.default.writeFileSync(frontendEnvPath, `NEXT_PUBLIC_API_URL=http://${lanIP}:3030/api/v1\n`, 'utf-8');
    const apiClientPath = path_1.default.join(FRONTEND_DIR, 'lib', 'apiClient.ts');
    if (fs_1.default.existsSync(apiClientPath)) {
        let content = fs_1.default.readFileSync(apiClientPath, 'utf-8');
        if (content.includes('window.location.href = "/login"')) {
            content = content.replace('window.location.href = "/login"', 'window.location.href = "/admin/login"');
            fs_1.default.writeFileSync(apiClientPath, content, 'utf-8');
        }
    }
}
function patchPwaConfig(lanIP) {
    const pwaEnvPath = path_1.default.join(PWA_DIR, '.env');
    fs_1.default.writeFileSync(pwaEnvPath, `VITE_API_BASE_URL=http://${lanIP}:3030/api/v1\n`, 'utf-8');
    const viteConfigPath = path_1.default.join(PWA_DIR, 'vite.config.ts');
    if (fs_1.default.existsSync(viteConfigPath)) {
        let content = fs_1.default.readFileSync(viteConfigPath, 'utf-8');
        if (!content.includes("base:")) {
            content = content.replace('export default defineConfig({', "export default defineConfig({\n  base: '/terminal/',");
        }
        else {
            content = content.replace(/base:\s*['"][^'"]*['"]/g, "base: '/terminal/'");
        }
        content = content.replace(/scope:\s*['"][^'"]*['"]/g, "scope: '/terminal/'");
        content = content.replace(/start_url:\s*['"][^'"]*['"]/g, "start_url: '/terminal/'");
        content = content.replace(/src:\s*'\/pwa-/g, "src: '/terminal/pwa-");
        content = content.replace(/src:\s*'\/favicon/g, "src: '/terminal/favicon");
        content = content.replace(/src:\s*'\/apple-touch/g, "src: '/terminal/apple-touch");
        fs_1.default.writeFileSync(viteConfigPath, content, 'utf-8');
    }
}
function patchBackendSpa() {
    const middlewareDir = path_1.default.join(BACKEND_DIR, 'src', 'core', 'middlewares');
    const spaMiddlewarePath = path_1.default.join(middlewareDir, 'SpaMiddleware.ts');
    if (!fs_1.default.existsSync(spaMiddlewarePath)) {
        if (!fs_1.default.existsSync(middlewareDir)) {
            fs_1.default.mkdirSync(middlewareDir, { recursive: true });
        }
        fs_1.default.writeFileSync(spaMiddlewarePath, `import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';

export function spaFallback(subPath: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') return next();
    if (req.path.includes('.')) return next();
    const indexFile = path.join(__dirname, '../../public', subPath, 'index.html');
    if (fs.existsSync(indexFile)) {
      res.sendFile(indexFile);
    } else {
      next();
    }
  };
}
`, 'utf-8');
    }
    const appTsPath = path_1.default.join(BACKEND_DIR, 'src', 'app.ts');
    let appContent = fs_1.default.readFileSync(appTsPath, 'utf-8');
    if (!appContent.includes('initializeSpaRoutes')) {
        if (!appContent.includes('SpaMiddleware')) {
            appContent = appContent.replace("import { globalErrorHandler } from './core/middlewares/ErrorMiddleware';", "import { globalErrorHandler } from './core/middlewares/ErrorMiddleware';\nimport { spaFallback } from './core/middlewares/SpaMiddleware';");
        }
        appContent = appContent.replace('this.initializeRoutes(routes);', 'this.initializeRoutes(routes);\n    this.initializeSpaRoutes();');
        const spaMethod = `
  private initializeSpaRoutes() {
    logger.info('Initializing SPA Routes ....');
    this.app.use('/admin/*', spaFallback('admin'));
    this.app.use('/terminal/*', spaFallback('terminal'));
    logger.info('SPA Routes Initialized Successfully');
  }

`;
        appContent = appContent.replace('  private initializeErrorHandling()', spaMethod + '  private initializeErrorHandling()');
        fs_1.default.writeFileSync(appTsPath, appContent, 'utf-8');
    }
}
async function deploy(sender, startFromStep = 0) {
    cancelled = false;
    activeChildren = [];
    const lanIP = (0, lan_detector_1.getLanIP)();
    const steps = [
        'Prepare Environment',
        'Build Backend',
        'Build Admin Panel',
        'Build Terminal PWA',
        'Prepare Admin Standalone',
        'Copy Terminal to Server',
        'Restart Services',
    ];
    const sendProgress = (step, status, detail) => {
        sender.send('deploy:progress', { step, name: steps[step], status, detail });
    };
    const sendLog = (line) => {
        sender.send('deploy:log', line);
    };
    let currentStep = 0;
    try {
        if (startFromStep > 0) {
            sendLog(`Continuing deploy from step ${startFromStep}...`);
            for (let i = 0; i < startFromStep; i++) {
                sendProgress(i, 'done');
            }
        }
        // Step 0: Pre-flight
        if (startFromStep <= 0) {
            currentStep = 0;
            sendProgress(0, 'running');
            sendLog(`Detected LAN IP: ${lanIP}`);
            sendLog('Patching frontend config (.env, apiClient.ts)...');
            patchFrontendConfig(lanIP);
            sendLog('Patching PWA config (vite.config.ts, .env)...');
            patchPwaConfig(lanIP);
            sendLog('Patching backend SPA middleware...');
            patchBackendSpa();
            const logsDir = path_1.default.join(BACKEND_DIR, 'logs');
            if (!fs_1.default.existsSync(logsDir))
                fs_1.default.mkdirSync(logsDir, { recursive: true });
            sendProgress(0, 'done');
            if (cancelled)
                throw new Error('Deploy cancelled');
        }
        // Step 1: Build Backend
        if (startFromStep <= 1) {
            currentStep = 1;
            sendProgress(1, 'running');
            sendLog('Building backend (TypeScript → JavaScript)...');
            await runCommand('npm', ['run', 'build'], BACKEND_DIR, sendLog);
            sendProgress(1, 'done');
            if (cancelled)
                throw new Error('Deploy cancelled');
        }
        // Step 2: Build Admin Panel
        if (startFromStep <= 2) {
            currentStep = 2;
            sendProgress(2, 'running');
            sendLog('Building admin panel (Next.js)...');
            await runCommand('npm', ['run', 'build'], FRONTEND_DIR, sendLog);
            sendProgress(2, 'done');
            if (cancelled)
                throw new Error('Deploy cancelled');
        }
        // Step 3: Build Terminal PWA
        if (startFromStep <= 3) {
            currentStep = 3;
            sendProgress(3, 'running');
            sendLog('Building terminal PWA (Vite)...');
            await runCommand('npm', ['run', 'build'], PWA_DIR, sendLog);
            sendProgress(3, 'done');
            if (cancelled)
                throw new Error('Deploy cancelled');
        }
        // Step 4: Prepare Admin Standalone
        if (startFromStep <= 4) {
            currentStep = 4;
            sendProgress(4, 'running');
            const standaloneDest = path_1.default.join(FRONTEND_DIR, '.next', 'standalone');
            // Copy static assets into standalone dir for Next.js to serve
            const staticSrc = path_1.default.join(FRONTEND_DIR, '.next', 'static');
            const staticDest = path_1.default.join(standaloneDest, '.next', 'static');
            if (fs_1.default.existsSync(staticSrc)) {
                sendLog('Copying static assets into standalone...');
                if (fs_1.default.existsSync(staticDest))
                    fs_1.default.rmSync(staticDest, { recursive: true, force: true });
                fs_1.default.cpSync(staticSrc, staticDest, { recursive: true });
            }
            // Copy public folder into standalone dir
            const publicSrc = path_1.default.join(FRONTEND_DIR, 'public');
            const publicDest = path_1.default.join(standaloneDest, 'public');
            if (fs_1.default.existsSync(publicSrc)) {
                sendLog('Copying public assets into standalone...');
                if (fs_1.default.existsSync(publicDest))
                    fs_1.default.rmSync(publicDest, { recursive: true, force: true });
                fs_1.default.cpSync(publicSrc, publicDest, { recursive: true });
            }
            // Ensure frontend logs dir exists
            const frontendLogsDir = path_1.default.join(FRONTEND_DIR, 'logs');
            if (!fs_1.default.existsSync(frontendLogsDir))
                fs_1.default.mkdirSync(frontendLogsDir, { recursive: true });
            sendLog('Admin standalone build prepared');
            sendProgress(4, 'done');
            if (cancelled)
                throw new Error('Deploy cancelled');
        }
        // Step 5: Copy Terminal -> public/terminal/
        if (startFromStep <= 5) {
            currentStep = 5;
            sendProgress(5, 'running');
            const pwaSrc = path_1.default.join(PWA_DIR, 'dist');
            const pwaDest = path_1.default.join(BACKEND_DIR, 'public', 'terminal');
            sendLog('Copying terminal build to server...');
            if (fs_1.default.existsSync(pwaDest)) {
                fs_1.default.rmSync(pwaDest, { recursive: true, force: true });
            }
            fs_1.default.cpSync(pwaSrc, pwaDest, { recursive: true });
            sendLog(`Copied terminal build to ${pwaDest}`);
            sendProgress(5, 'done');
            if (cancelled)
                throw new Error('Deploy cancelled');
        }
        // Step 6: Restart Services
        if (startFromStep <= 6) {
            currentStep = 6;
            sendProgress(6, 'running');
            sendLog('Restarting all services via PM2...');
            try {
                await pm2Manager.restart();
            }
            catch {
                sendLog('PM2 processes not found, starting fresh...');
                await pm2Manager.start();
            }
            sendLog('All services restarted successfully!');
            sendProgress(6, 'done');
        }
        sender.send('deploy:complete', { success: true });
    }
    catch (err) {
        sendLog(`[ERROR] ${err.message}`);
        sendProgress(currentStep, 'error');
        sender.send('deploy:complete', { success: false, error: err.message });
    }
}
function cancel() {
    cancelled = true;
    for (const child of activeChildren) {
        try {
            child.kill('SIGTERM');
        }
        catch { }
    }
    activeChildren = [];
}
//# sourceMappingURL=deploy-manager.js.map