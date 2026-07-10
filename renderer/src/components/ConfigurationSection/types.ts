export type ConfigData = {
  general: { applicationName?: string; port?: string; nodeEnv?: string };
  db: { host?: string; port?: string; database?: string; username?: string; password?: string; schema?: string };
  security: { jwtSecret?: string; accessTokenExpiry?: string; refreshTokenExpiry?: string };
  email: { smtpHost?: string; smtpPort?: string; smtpUsername?: string; smtpPassword?: string; smtpSecure?: boolean };
  advanced: Record<string, string>;
  lastSaved?: string | null;
};
