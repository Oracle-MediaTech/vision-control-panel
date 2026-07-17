import fs from "fs";
import path from "path";
import { app } from "electron";
import { Config } from "./configuration-manager";

export function getConfigDirectory() {
  const dir = path.join(
    app.getPath("documents"),
    "Vision Control Panel"
  );

  fs.mkdirSync(dir, { recursive: true });

  return dir;
}

export function getConfigEnvPath() {
  return path.join(getConfigDirectory(), ".env");
}

export function getBackendEnvPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "backend", ".env");
  }

  return path.join(
    __dirname,
    "../../",
    "../vfc-backend",
    ".env"
  );
}
export function syncBackendEnv() {

  const source = getConfigEnvPath();

  const destination = getBackendEnvPath();

  const sourceText = fs.readFileSync(
    source,
    "utf8"
  );

  const destinationText =
    fs.existsSync(destination)
      ? fs.readFileSync(destination, "utf8")
      : "";

  if (sourceText === destinationText) {

    return;
  }

  fs.writeFileSync(
    destination,
    sourceText
  );
}

export function ensureConfiguration() {
  const config = getConfigEnvPath();

  if (fs.existsSync(config)) {
    return;
  }

  fs.copyFileSync(
    getBackendEnvPath(),
    config
  );
}

export function uiConfigToConfig(ui: any): Config {
  return {
    general: {
      APP_NAME: ui.general.applicationName,
      PORT: ui.general.port,
    },

    database: {
      host: ui.db.host,
      port: ui.db.port,
      database: ui.db.database,
      user: ui.db.username,
      password: ui.db.password,
      schema: ui.db.schema,
    },

    security: {
      JWT_SECRET: ui.security.jwtSecret,
      ACCESS_TOKEN_EXPIRY: ui.security.accessTokenExpiry,
      REFRESH_TOKEN_EXPIRY: ui.security.refreshTokenExpiry,
    },

    email: {
      SMTP_HOST: ui.email.smtpHost,
      SMTP_PORT: ui.email.smtpPort,
      SMTP_USER: ui.email.smtpUsername,
      SMTP_PASS: ui.email.smtpPassword,
      SMTP_SECURE: ui.email.smtpSecure,
    },

    advanced: ui.advanced,
  };
}

export function writeFileAtomic(file: string, text: string) {
  const tmp = `${file}.tmp`;

  fs.writeFileSync(tmp, text, "utf8");

  fs.renameSync(tmp, file);
}

export async function prepareBackend() {

  ensureConfiguration();

  syncBackendEnv();

}