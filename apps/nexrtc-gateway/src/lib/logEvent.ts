// src/lib/logEvent.ts

import fs from "fs";
import path from "path";

export interface LogMeta {
  [key: string]: any;
}

const logDir = path.join(process.cwd(), "logs");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, "events.log");

// Core log function
export function logEvent(event: string, meta: LogMeta = {}): void {
  const entry = { timestamp: new Date().toISOString(), event, ...meta };
  const line = JSON.stringify(entry);

  console.log(line);

  try {
    fs.appendFileSync(logFile, line + "\n");
  } catch (err) {
    console.error("Failed to write log", err);
  }

  if (sentry) {
    sentry.captureMessage(line);
  }
}

// Optional Sentry integration
let sentry: typeof import("@sentry/node") | null = null;

if (process.env.SENTRY_DSN) {
  import("@sentry/node")
    .then((mod) => {
      sentry = mod;
      sentry.init({ dsn: process.env.SENTRY_DSN });
    })
    .catch((err) => {
      console.warn("Sentry init failed", err);
    });
}
