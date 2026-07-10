import fs from 'fs';
import path from 'path';
import os from 'os';
import { dialog } from 'electron';
import { parseDotEnv, parseDotEnvText, stringifyDotEnv, getBackendDotEnvPath } from './env-manager';
import { parse as parseUrl } from 'url';
import { Client } from 'pg';

export type Config = {
  general: { APP_NAME?: string; PORT?: string; NODE_ENV?: string };
  database: { host?: string; port?: string; database?: string; user?: string; password?: string; schema?: string };
  security: { JWT_SECRET?: string; ACCESS_TOKEN_EXPIRY?: string; REFRESH_TOKEN_EXPIRY?: string };
  email: { SMTP_HOST?: string; SMTP_PORT?: string; SMTP_USER?: string; SMTP_PASS?: string; SMTP_SECURE?: string };
  advanced: Record<string, string>;
};

function buildDatabaseUrl(parts: any): string {
  const user = encodeURIComponent(parts.user || '');
  const pass = encodeURIComponent(parts.password || '');
  const host = parts.host || 'localhost';
  const port = parts.port || '5432';
  const db = parts.database || '';
  return `postgresql://${user}:${pass}@${host}:${port}/${db}`;
}

export function loadConfiguration(): Config {
  const backendPath = getBackendDotEnvPath();
  const backendContent = backendPath && fs.existsSync(backendPath) ? fs.readFileSync(backendPath, 'utf-8') : '';
  const userDataPath = path.join((process as any).env.APPDATA || process.env.HOME || os.homedir(), '.config', 'vision-control-panel');
  // Prefer reading via env-manager where possible; fallback to backend content parse
  const merged = parseDotEnvText(backendContent);

  const cfg: Config = {
    general: { APP_NAME: merged.APP_NAME, PORT: merged.PORT, NODE_ENV: 'production' },
    database: {
      host: merged.DB_HOST || merged.PGHOST || undefined,
      port: merged.DB_PORT || merged.PGPORT || undefined,
      database: merged.DB_NAME || merged.PGDATABASE || merged.POSTGRES_DB || undefined,
      user: merged.DB_USER || merged.PGUSER || undefined,
      password: merged.DB_PASS || merged.PGPASSWORD || undefined,
      schema: merged.DB_SCHEMA || merged.PGSCHEMA || undefined,
    },
    security: { JWT_SECRET: merged.JWT_SECRET, ACCESS_TOKEN_EXPIRY: merged.ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY: merged.REFRESH_TOKEN_EXPIRY },
    email: { SMTP_HOST: merged.SMTP_HOST, SMTP_PORT: merged.SMTP_PORT, SMTP_USER: merged.SMTP_USER, SMTP_PASS: merged.SMTP_PASS, SMTP_SECURE: merged.SMTP_SECURE },
    advanced: {},
  };
  // collect unknowns
  for (const [k, v] of Object.entries(merged)) {
    if (!['APP_NAME', 'PORT', 'NODE_ENV', 'DB_HOST', 'PGHOST', 'DB_PORT', 'PGPORT', 'DB_NAME', 'PGDATABASE', 'POSTGRES_DB', 'DB_USER', 'PGUSER', 'DB_PASS', 'PGPASSWORD', 'DB_SCHEMA', 'PGSCHEMA', 'JWT_SECRET', 'ACCESS_TOKEN_EXPIRY', 'REFRESH_TOKEN_EXPIRY', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_SECURE'].includes(k)) {
      cfg.advanced[k] = v;
    }
  }
  return cfg;
}

export async function testDatabaseConnection(parts: any): Promise<{ success: boolean; error?: string }> {
  const conn = buildDatabaseUrl(parts);
  // parse to get user/pass/host/port/db
  const client = new Client({ connectionString: conn });
  try {
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    return { success: true };
  } catch (err: any) {
    try { await client.end(); } catch { }
    return { success: false, error: err.message };
  }
}

export function exportEnv(content: string, browserWindow: any) {
  const res = dialog.showSaveDialogSync(browserWindow, { title: 'Export .env', defaultPath: '.env' });
  if (!res) return { success: false, error: 'cancelled' };
  fs.writeFileSync(res, content, 'utf-8');
  return { success: true, path: res };
}

export function importEnvFromFile(filePath: string): Config {
  const text = fs.readFileSync(filePath, 'utf-8');
  const obj = parseDotEnvText(text);
  const cfg = loadConfiguration();
  // map known keys
  if (obj.DATABASE_URL) {
    try {
      const u = new URL(obj.DATABASE_URL);
      cfg.database.host = u.hostname;
      cfg.database.port = u.port || '5432';
      cfg.database.database = u.pathname.replace(/^\//, '');
      cfg.database.user = decodeURIComponent(u.username);
      cfg.database.password = decodeURIComponent(u.password);
    } catch { }
  }
  if (obj.JWT_SECRET) cfg.security.JWT_SECRET = obj.JWT_SECRET;
  if (obj.SMTP_HOST) cfg.email.SMTP_HOST = obj.SMTP_HOST;
  for (const [k, v] of Object.entries(obj)) {
    if (!(k in cfg.general) && !(k in cfg.database) && !(k in cfg.security) && !(k in cfg.email)) {
      cfg.advanced[k] = v;
    }
  }
  return cfg;
}

export function saveConfigurationToBackendEnv(cfg: Config) {
  // Build object
  const obj: Record<string, string> = {};
  if (cfg.general.APP_NAME) obj.APP_NAME = cfg.general.APP_NAME;
  if (cfg.general.PORT) obj.PORT = cfg.general.PORT;
  obj.NODE_ENV = 'production';
  if (cfg.database.user) obj.PGUSER = cfg.database.user;
  if (cfg.database.password) obj.PGPASSWORD = cfg.database.password;
  if (cfg.database.host) obj.PGHOST = cfg.database.host;
  if (cfg.database.port) obj.PGPORT = cfg.database.port;
  if (cfg.database.database) obj.PGDATABASE = cfg.database.database;
  if (cfg.database.schema) obj.PGSCHEMA = cfg.database.schema;
  if (cfg.security.JWT_SECRET) obj.JWT_SECRET = cfg.security.JWT_SECRET;
  if (cfg.security.ACCESS_TOKEN_EXPIRY) obj.ACCESS_TOKEN_EXPIRY = cfg.security.ACCESS_TOKEN_EXPIRY;
  if (cfg.security.REFRESH_TOKEN_EXPIRY) obj.REFRESH_TOKEN_EXPIRY = cfg.security.REFRESH_TOKEN_EXPIRY;
  if (cfg.email.SMTP_HOST) obj.SMTP_HOST = cfg.email.SMTP_HOST;
  if (cfg.email.SMTP_PORT) obj.SMTP_PORT = cfg.email.SMTP_PORT;
  if (cfg.email.SMTP_USER) obj.SMTP_USER = cfg.email.SMTP_USER;
  if (cfg.email.SMTP_PASS) obj.SMTP_PASS = cfg.email.SMTP_PASS;
  if (cfg.email.SMTP_SECURE) obj.SMTP_SECURE = cfg.email.SMTP_SECURE;
  for (const [k, v] of Object.entries(cfg.advanced)) obj[k] = v;

  const text = stringifyDotEnv(obj);
  const backendPath = getBackendDotEnvPath();
  if (!backendPath) throw new Error('Backend .env path not found');
  fs.mkdirSync(path.dirname(backendPath), { recursive: true });
  fs.writeFileSync(backendPath, text, 'utf-8');
  return { success: true, path: backendPath };
}
