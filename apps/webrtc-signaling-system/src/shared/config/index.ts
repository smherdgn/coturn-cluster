// src/shared/config/index.ts - Fixed version
import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string().default('webrtc_signaling'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('password'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  CORS_CREDENTIALS: z.coerce.boolean().default(true),

  // Rate Limiting
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW: z.coerce.number().default(900000), // 15 minutes

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().default('logs/app.log'),

  // WebRTC
  STUN_SERVERS: z.string().default('stun:stun.l.google.com:19302'),
  TURN_SERVERS: z.string().optional(),

  // Room Configuration
  MAX_ROOM_SIZE: z.coerce.number().default(8),
  ROOM_CLEANUP_INTERVAL: z.coerce.number().default(300000), // 5 minutes
  SESSION_TIMEOUT: z.coerce.number().default(3600000), // 1 hour
});

// Validate environment variables
const env = envSchema.parse(process.env);

// Configuration object
export const config = {
  env: env.NODE_ENV,
  server: {
    port: env.PORT,
    host: env.HOST,
  },
  database: {
    url: env.DATABASE_URL,
    host: env.DB_HOST,
    port: env.DB_PORT,
    name: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    maxConnections: 20,
    idleTimeout: 30,
    connectTimeout: 60,
  },
  redis: {
    url: env.REDIS_URL,
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    connectTimeout: 10000,
  },
  jwt: {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  cors: {
    origin: env.CORS_ORIGIN.split(',').map(origin => origin.trim()),
    credentials: env.CORS_CREDENTIALS,
  },
  rateLimit: {
    max: env.RATE_LIMIT_MAX,
    windowMs: env.RATE_LIMIT_WINDOW,
  },
  logging: {
    level: env.LOG_LEVEL,
    file: env.LOG_FILE,
  },
  webrtc: {
    stunServers: env.STUN_SERVERS.split(',').map(server => server.trim()),
    turnServers: env.TURN_SERVERS ? env.TURN_SERVERS.split(',').map(server => server.trim()) : [],
  },
  room: {
    maxSize: env.MAX_ROOM_SIZE,
    cleanupInterval: env.ROOM_CLEANUP_INTERVAL,
    sessionTimeout: env.SESSION_TIMEOUT,
  },
} as const;

// Type export
export type Config = typeof config;

// Environment check
if (env.NODE_ENV === 'production') {
  console.log('✅ Running in production mode');
} else {
  console.log(`🔧 Running in ${env.NODE_ENV} mode`);
}

// REMOVE THIS LINE - it's causing circular dependency:
// export { securityConfig } from './security';