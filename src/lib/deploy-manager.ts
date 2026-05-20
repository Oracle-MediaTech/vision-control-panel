import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import { WebContents } from 'electron';
import { getLanIP } from './lan-detector';
import * as pm2Manager from './pm2-manager';

const BACKEND_DIR = path.resolve(__dirname, '../../../vfc-backend');
const FRONTEND_DIR = path.resolve(__dirname, '../../../vfc-frontend');
const PWA_DIR = path.resolve(__dirname, '../../../vision-attendance-pwa');

let activeChildren: ChildProcess[] = [];
let cancelled = false;

function runCommand(cmd: string, args: string[], cwd: string, onLog: (line: string) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { shell: true, cwd, env: { ...process.env } });
    activeChildren.push(child);

    const processData = (data: Buffer): void => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (line.trim()) onLog(line.trim());
      }
    };

    child.stdout.on('data', processData);
    child.stderr.on('data', processData);

    child.on('close', (code: number | null) => {
      activeChildren = activeChildren.filter(c => c !== child);
      if (cancelled) {
        reject(new Error('Deploy cancelled'));
      } else if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (err: Error) => {
      activeChildren = activeChildren.filter(c => c !== child);
      reject(err);
    });
  });
}

function patchFrontendConfig(lanIP: string): void {
  const frontendEnvPath = path.join(FRONTEND_DIR, '.env');
  fs.writeFileSync(frontendEnvPath, `NEXT_PUBLIC_API_URL=http://${lanIP}:3030/api/v1\n`, 'utf-8');

  const apiClientPath = path.join(FRONTEND_DIR, 'lib', 'apiClient.ts');
  if (fs.existsSync(apiClientPath)) {
    let content = fs.readFileSync(apiClientPath, 'utf-8');
    if (content.includes('window.location.href = "/login"')) {
      content = content.replace(
        'window.location.href = "/login"',
        'window.location.href = "/admin/login"'
      );
      fs.writeFileSync(apiClientPath, content, 'utf-8');
    }
  }
}

function patchPwaConfig(lanIP: string): void {
  const pwaEnvPath = path.join(PWA_DIR, '.env');
  fs.writeFileSync(pwaEnvPath, `VITE_API_BASE_URL=http://${lanIP}:3030/api/v1\n`, 'utf-8');

  const viteConfigPath = path.join(PWA_DIR, 'vite.config.ts');
  if (fs.existsSync(viteConfigPath)) {
    let content = fs.readFileSync(viteConfigPath, 'utf-8');

    if (!content.includes("base:")) {
      content = content.replace(
        'export default defineConfig({',
        "export default defineConfig({\n  base: '/terminal/',"
      );
    } else {
      content = content.replace(/base:\s*['"][^'"]*['"]/g, "base: '/terminal/'");
    }

    content = content.replace(/scope:\s*['"][^'"]*['"]/g, "scope: '/terminal/'");
    content = content.replace(/start_url:\s*['"][^'"]*['"]/g, "start_url: '/terminal/'");

    content = content.replace(/src:\s*'\/pwa-/g, "src: '/terminal/pwa-");
    content = content.replace(/src:\s*'\/favicon/g, "src: '/terminal/favicon");
    content = content.replace(/src:\s*'\/apple-touch/g, "src: '/terminal/apple-touch");

    fs.writeFileSync(viteConfigPath, content, 'utf-8');
  }
}

function patchBackendSpa(): void {
  const middlewareDir = path.join(BACKEND_DIR, 'src', 'core', 'middlewares');
  const spaMiddlewarePath = path.join(middlewareDir, 'SpaMiddleware.ts');

  if (!fs.existsSync(spaMiddlewarePath)) {
    if (!fs.existsSync(middlewareDir)) {
      fs.mkdirSync(middlewareDir, { recursive: true });
    }
    fs.writeFileSync(spaMiddlewarePath, `import { Request, Response, NextFunction } from 'express';
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

  const appTsPath = path.join(BACKEND_DIR, 'src', 'app.ts');
  let appContent = fs.readFileSync(appTsPath, 'utf-8');

  if (!appContent.includes('initializeSpaRoutes')) {
    if (!appContent.includes('SpaMiddleware')) {
      appContent = appContent.replace(
        "import { globalErrorHandler } from './core/middlewares/ErrorMiddleware';",
        "import { globalErrorHandler } from './core/middlewares/ErrorMiddleware';\nimport { spaFallback } from './core/middlewares/SpaMiddleware';"
      );
    }

    appContent = appContent.replace(
      'this.initializeRoutes(routes);',
      'this.initializeRoutes(routes);\n    this.initializeSpaRoutes();'
    );

    const spaMethod = `
  private initializeSpaRoutes() {
    logger.info('Initializing SPA Routes ....');
    this.app.use('/admin/*', spaFallback('admin'));
    this.app.use('/terminal/*', spaFallback('terminal'));
    logger.info('SPA Routes Initialized Successfully');
  }

`;
    appContent = appContent.replace(
      '  private initializeErrorHandling()',
      spaMethod + '  private initializeErrorHandling()'
    );

    fs.writeFileSync(appTsPath, appContent, 'utf-8');
  }
}

export async function deploy(sender: WebContents, startFromStep: number = 0): Promise<void> {
  cancelled = false;
  activeChildren = [];
  const lanIP = getLanIP();

  const steps = [
    'Prepare Environment',
    'Build Backend',
    'Build Admin Panel',
    'Build Terminal PWA',
    'Prepare Admin Standalone',
    'Copy Terminal to Server',
    'Restart Services',
  ];

  const sendProgress = (step: number, status: string, detail?: string): void => {
    sender.send('deploy:progress', { step, name: steps[step], status, detail });
  };

  const sendLog = (line: string): void => {
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

      const logsDir = path.join(BACKEND_DIR, 'logs');
      if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

      sendProgress(0, 'done');
      if (cancelled) throw new Error('Deploy cancelled');
    }

    // Step 1: Build Backend
    if (startFromStep <= 1) {
      currentStep = 1;
      sendProgress(1, 'running');
      sendLog('Building backend (TypeScript → JavaScript)...');
      await runCommand('npm', ['run', 'build'], BACKEND_DIR, sendLog);
      sendProgress(1, 'done');
      if (cancelled) throw new Error('Deploy cancelled');
    }

    // Step 2: Build Admin Panel
    if (startFromStep <= 2) {
      currentStep = 2;
      sendProgress(2, 'running');
      sendLog('Building admin panel (Next.js)...');
      await runCommand('npm', ['run', 'build'], FRONTEND_DIR, sendLog);
      sendProgress(2, 'done');
      if (cancelled) throw new Error('Deploy cancelled');
    }

    // Step 3: Build Terminal PWA
    if (startFromStep <= 3) {
      currentStep = 3;
      sendProgress(3, 'running');
      sendLog('Building terminal PWA (Vite)...');
      await runCommand('npm', ['run', 'build'], PWA_DIR, sendLog);
      sendProgress(3, 'done');
      if (cancelled) throw new Error('Deploy cancelled');
    }

    // Step 4: Prepare Admin Standalone
    if (startFromStep <= 4) {
      currentStep = 4;
      sendProgress(4, 'running');
      const standaloneDest = path.join(FRONTEND_DIR, '.next', 'standalone');

      // Copy static assets into standalone dir for Next.js to serve
      const staticSrc = path.join(FRONTEND_DIR, '.next', 'static');
      const staticDest = path.join(standaloneDest, '.next', 'static');
      if (fs.existsSync(staticSrc)) {
        sendLog('Copying static assets into standalone...');
        if (fs.existsSync(staticDest)) fs.rmSync(staticDest, { recursive: true, force: true });
        fs.cpSync(staticSrc, staticDest, { recursive: true });
      }

      // Copy public folder into standalone dir
      const publicSrc = path.join(FRONTEND_DIR, 'public');
      const publicDest = path.join(standaloneDest, 'public');
      if (fs.existsSync(publicSrc)) {
        sendLog('Copying public assets into standalone...');
        if (fs.existsSync(publicDest)) fs.rmSync(publicDest, { recursive: true, force: true });
        fs.cpSync(publicSrc, publicDest, { recursive: true });
      }

      // Ensure frontend logs dir exists
      const frontendLogsDir = path.join(FRONTEND_DIR, 'logs');
      if (!fs.existsSync(frontendLogsDir)) fs.mkdirSync(frontendLogsDir, { recursive: true });

      sendLog('Admin standalone build prepared');
      sendProgress(4, 'done');
      if (cancelled) throw new Error('Deploy cancelled');
    }

    // Step 5: Copy Terminal -> public/terminal/
    if (startFromStep <= 5) {
      currentStep = 5;
      sendProgress(5, 'running');
      const pwaSrc = path.join(PWA_DIR, 'dist');
      const pwaDest = path.join(BACKEND_DIR, 'public', 'terminal');

      sendLog('Copying terminal build to server...');
      if (fs.existsSync(pwaDest)) {
        fs.rmSync(pwaDest, { recursive: true, force: true });
      }
      fs.cpSync(pwaSrc, pwaDest, { recursive: true });
      sendLog(`Copied terminal build to ${pwaDest}`);
      sendProgress(5, 'done');
      if (cancelled) throw new Error('Deploy cancelled');
    }

    // Step 6: Restart Services
    if (startFromStep <= 6) {
      currentStep = 6;
      sendProgress(6, 'running');
      sendLog('Restarting all services via PM2...');
      try {
        await pm2Manager.restart();
      } catch {
        sendLog('PM2 processes not found, starting fresh...');
        await pm2Manager.start();
      }
      sendLog('All services restarted successfully!');
      sendProgress(6, 'done');
    }

    sender.send('deploy:complete', { success: true });

  } catch (err: any) {
    sendLog(`[ERROR] ${err.message}`);
    sendProgress(currentStep, 'error');
    sender.send('deploy:complete', { success: false, error: err.message });
  }
}

export function cancel(): void {
  cancelled = true;
  for (const child of activeChildren) {
    try { child.kill('SIGTERM'); } catch { }
  }
  activeChildren = [];
}
