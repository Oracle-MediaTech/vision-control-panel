import { app } from 'electron';
import fs from 'fs';
import path from 'path';

const STUB_ENV = `# Vision Control Panel - backend environment.
# Edit these values, then click "Start" (or "Restart") in the panel.
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vfc
JWT_SECRET=change-me
`;

let cachedUserData: string | null = null;

function userData(): string {
  if (!cachedUserData) cachedUserData = app.getPath('userData');
  return cachedUserData;
}

export function getEnvPath(): string {
  return path.join(userData(), '.env');
}

export function getLogsDir(): string {
  const dir = path.join(userData(), 'logs');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Ensure a writable .env exists in userData. Creates a stub the first time the
 * app launches so the renderer's Settings tab has something to load.
 */
export function ensureEnvFile(): void {
  const envPath = getEnvPath();
  if (!fs.existsSync(envPath)) {
    fs.mkdirSync(path.dirname(envPath), { recursive: true });
    fs.writeFileSync(envPath, STUB_ENV, 'utf-8');
  }
}

/**
 * Parse a dotenv-style file into a plain object. Minimal subset — KEY=VALUE,
 * comments starting with #, blank lines ignored. Values are NOT shell-expanded.
 */
export function parseDotEnv(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const out: Record<string, string> = {};
  const text = fs.readFileSync(filePath, 'utf-8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) out[key] = value;
  }
  return out;
}

/** Returns the env vars the bundled backend should be started with. */
export function getBackendEnv(): Record<string, string> {
  return {
    ...parseDotEnv(getEnvPath()),
    VCP_LOG_DIR: getLogsDir(),
  };
}

/** Read the raw .env text for the renderer's Settings tab. */
export function readEnvFile(): string {
  const envPath = getEnvPath();
  if (!fs.existsSync(envPath)) return STUB_ENV;
  return fs.readFileSync(envPath, 'utf-8');
}

/** Write raw .env text from the renderer's Settings tab. */
export function writeEnvFile(content: string): void {
  const envPath = getEnvPath();
  fs.mkdirSync(path.dirname(envPath), { recursive: true });
  fs.writeFileSync(envPath, content, 'utf-8');
}
