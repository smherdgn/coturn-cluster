export interface LogMeta {
  [key: string]: any;
}

// Basic logEvent helper that writes JSON lines to console and optionally disk
import fs from 'fs';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, 'events.log');

export function logEvent(event: string, meta: LogMeta = {}): void {
  const entry = { timestamp: new Date().toISOString(), event, ...meta };
  const line = JSON.stringify(entry);
  console.log(line);
  try {
    fs.appendFileSync(logFile, line + '\n');
  } catch (err) {
    console.error('Failed to write log', err);
  }
}

// Optional Sentry integration
if (process.env.SENTRY_DSN) {
  (async () => {
    try {
      const mod = '@sentry/node';
      // @ts-ignore
      const Sentry = await import(mod);
      Sentry.init({ dsn: process.env.SENTRY_DSN });
    } catch (err) {
      console.warn('Sentry init failed', err);
    }
  })();
}
