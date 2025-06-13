#!/bin/bash

# WebRTC Signaling Server - Redis & Config Setup
echo "🔧 Setting up Redis connection and configuration layer..."

# Ensure we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run from signaling-server directory."
    exit 1
fi

# Create Redis connection
echo "🔗 Creating Redis connection..."
cat > src/shared/redis/connection.ts << 'EOF'
import { createClient, RedisClientType } from 'redis';
import { config } from '../config';
import { logger } from '../utils/logger';

// Redis client type
export type RedisClient = RedisClientType;

// Create Redis client
export const redisClient: RedisClient = createClient({
  url: config.redis.url,
  socket: {
    connectTimeout: config.redis.connectTimeout,
    lazyConnect: true,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis: Max reconnection attempts reached');
        return new Error('Max reconnection attempts reached');
      }
      const delay = Math.min(retries * 50, 2000);
      logger.warn(`Redis: Reconnecting in ${delay}ms (attempt ${retries})`);
      return delay;
    },
  },
  password: config.redis.password || undefined,
});

// Redis event handlers
redisClient.on('connect', () => {
  logger.info('Redis: Connecting...');
});

redisClient.on('ready', () => {
  logger.info('Redis: Connection ready');
});

redisClient.on('error', (error) => {
  logger.error('Redis: Connection error', error);
});

redisClient.on('end', () => {
  logger.info('Redis: Connection ended');
});

redisClient.on('reconnecting', () => {
  logger.warn('Redis: Reconnecting...');
});

// Connect to Redis
export async function connectRedis(): Promise<void> {
  try {
    await redisClient.connect();
    logger.info('✅ Redis connection established');
  } catch (error) {
    logger.error('❌ Redis connection failed:', error);
    throw error;
  }
}

// Health check function
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const pong = await redisClient.ping();
    if (pong === 'PONG') {
      logger.info('Redis connection is healthy');
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeRedisConnection(): Promise<void> {
  try {
    if (redisClient.isOpen) {
      await redisClient.disconnect();
      logger.info('Redis connection closed');
    }
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
  }
}

// Graceful shutdown handlers
process.on('SIGINT', closeRedisConnection);
process.on('SIGTERM', closeRedisConnection);
process.on('beforeExit', closeRedisConnection);
EOF

# Create Redis services
echo "⚡ Creating Redis services..."
cat > src/shared/redis/services.ts << 'EOF'
import { redisClient } from './connection';
import { logger } from '../utils/logger';

// Cache service
export class CacheService {
  private static instance: CacheService;
  
  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // Set cache with TTL
  async set(key: string, value: string | object, ttlSeconds?: number): Promise<void> {
    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (ttlSeconds) {
        await redisClient.setEx(key, ttlSeconds, serializedValue);
      } else {
        await redisClient.set(key, serializedValue);
      }
      
      logger.debug(`Cache: Set key ${key}`);
    } catch (error) {
      logger.error(`Cache: Failed to set key ${key}`, error);
      throw error;
    }
  }

  // Get cache
  async get<T = string>(key: string, parseJson = false): Promise<T | null> {
    try {
      const value = await redisClient.get(key);
      if (!value) return null;
      
      if (parseJson) {
        return JSON.parse(value) as T;
      }
      
      return value as T;
    } catch (error) {
      logger.error(`Cache: Failed to get key ${key}`, error);
      return null;
    }
  }

  // Delete cache
  async del(key: string): Promise<boolean> {
    try {
      const result = await redisClient.del(key);
      logger.debug(`Cache: Deleted key ${key}`);
      return result > 0;
    } catch (error) {
      logger.error(`Cache: Failed to delete key ${key}`, error);
      return false;
    }
  }

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result > 0;
    } catch (error) {
      logger.error(`Cache: Failed to check existence of key ${key}`, error);
      return false;
    }
  }

  // Set with expiration
  async setWithExpiry(key: string, value: string | object, expiryDate: Date): Promise<void> {
    try {
      const ttl = Math.floor((expiryDate.getTime() - Date.now()) / 1000);
      if (ttl > 0) {
        await this.set(key, value, ttl);
      }
    } catch (error) {
      logger.error(`Cache: Failed to set key ${key} with expiry`, error);
      throw error;
    }
  }

  // Increment value
  async increment(key: string, by = 1): Promise<number> {
    try {
      return await redisClient.incrBy(key, by);
    } catch (error) {
      logger.error(`Cache: Failed to increment key ${key}`, error);
      throw error;
    }
  }

  // Set expiration
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const result = await redisClient.expire(key, ttlSeconds);
      return result;
    } catch (error) {
      logger.error(`Cache: Failed to set expiration for key ${key}`, error);
      return false;
    }
  }
}

// Pub/Sub service
export class PubSubService {
  private static instance: PubSubService;
  private publisher = redisClient.duplicate();
  private subscriber = redisClient.duplicate();
  private isConnected = false;

  static getInstance(): PubSubService {
    if (!PubSubService.instance) {
      PubSubService.instance = new PubSubService();
    }
    return PubSubService.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      await Promise.all([
        this.publisher.connect(),
        this.subscriber.connect()
      ]);
      this.isConnected = true;
      logger.info('✅ Redis Pub/Sub connected');
    } catch (error) {
      logger.error('❌ Redis Pub/Sub connection failed:', error);
      throw error;
    }
  }

  // Publish message
  async publish(channel: string, message: string | object): Promise<void> {
    try {
      if (!this.isConnected) await this.connect();
      
      const serializedMessage = typeof message === 'string' ? message : JSON.stringify(message);
      await this.publisher.publish(channel, serializedMessage);
      
      logger.debug(`PubSub: Published to channel ${channel}`);
    } catch (error) {
      logger.error(`PubSub: Failed to publish to channel ${channel}`, error);
      throw error;
    }
  }

  // Subscribe to channel
  async subscribe(channel: string, callback: (message: string, channel: string) => void): Promise<void> {
    try {
      if (!this.isConnected) await this.connect();
      
      await this.subscriber.subscribe(channel, callback);
      logger.info(`PubSub: Subscribed to channel ${channel}`);
    } catch (error) {
      logger.error(`PubSub: Failed to subscribe to channel ${channel}`, error);
      throw error;
    }
  }

  // Unsubscribe from channel
  async unsubscribe(channel: string): Promise<void> {
    try {
      await this.subscriber.unsubscribe(channel);
      logger.info(`PubSub: Unsubscribed from channel ${channel}`);
    } catch (error) {
      logger.error(`PubSub: Failed to unsubscribe from channel ${channel}`, error);
      throw error;
    }
  }

  // Pattern subscribe
  async pSubscribe(pattern: string, callback: (message: string, channel: string) => void): Promise<void> {
    try {
      if (!this.isConnected) await this.connect();
      
      await this.subscriber.pSubscribe(pattern, callback);
      logger.info(`PubSub: Pattern subscribed to ${pattern}`);
    } catch (error) {
      logger.error(`PubSub: Failed to pattern subscribe to ${pattern}`, error);
      throw error;
    }
  }

  // Disconnect
  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await Promise.all([
          this.publisher.disconnect(),
          this.subscriber.disconnect()
        ]);
        this.isConnected = false;
        logger.info('Redis Pub/Sub disconnected');
      }
    } catch (error) {
      logger.error('Error disconnecting Redis Pub/Sub:', error);
    }
  }
}

// Session management service
export class SessionService {
  private static instance: SessionService;
  private cache: CacheService;

  constructor() {
    this.cache = CacheService.getInstance();
  }

  static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  // Store user session
  async storeUserSession(userId: string, sessionData: object, ttlSeconds = 3600): Promise<void> {
    const key = `session:user:${userId}`;
    await this.cache.set(key, sessionData, ttlSeconds);
  }

  // Get user session
  async getUserSession<T = object>(userId: string): Promise<T | null> {
    const key = `session:user:${userId}`;
    return await this.cache.get<T>(key, true);
  }

  // Delete user session
  async deleteUserSession(userId: string): Promise<boolean> {
    const key = `session:user:${userId}`;
    return await this.cache.del(key);
  }

  // Store socket session
  async storeSocketSession(socketId: string, sessionData: object, ttlSeconds = 1800): Promise<void> {
    const key = `session:socket:${socketId}`;
    await this.cache.set(key, sessionData, ttlSeconds);
  }

  // Get socket session
  async getSocketSession<T = object>(socketId: string): Promise<T | null> {
    const key = `session:socket:${socketId}`;
    return await this.cache.get<T>(key, true);
  }

  // Delete socket session
  async deleteSocketSession(socketId: string): Promise<boolean> {
    const key = `session:socket:${socketId}`;
    return await this.cache.del(key);
  }

  // Store room session
  async storeRoomSession(roomId: string, sessionData: object, ttlSeconds = 7200): Promise<void> {
    const key = `session:room:${roomId}`;
    await this.cache.set(key, sessionData, ttlSeconds);
  }

  // Get room session
  async getRoomSession<T = object>(roomId: string): Promise<T | null> {
    const key = `session:room:${roomId}`;
    return await this.cache.get<T>(key, true);
  }

  // Delete room session
  async deleteRoomSession(roomId: string): Promise<boolean> {
    const key = `session:room:${roomId}`;
    return await this.cache.del(key);
  }
}

// Rate limiting service
export class RateLimitService {
  private static instance: RateLimitService;
  private cache: CacheService;

  constructor() {
    this.cache = CacheService.getInstance();
  }

  static getInstance(): RateLimitService {
    if (!RateLimitService.instance) {
      RateLimitService.instance = new RateLimitService();
    }
    return RateLimitService.instance;
  }

  // Check rate limit
  async checkRateLimit(identifier: string, maxRequests: number, windowSeconds: number): Promise<{ allowed: boolean; remainingRequests: number; resetTime: number }> {
    const key = `ratelimit:${identifier}`;
    
    try {
      const current = await this.cache.increment(key);
      
      if (current === 1) {
        await this.cache.expire(key, windowSeconds);
      }
      
      const allowed = current <= maxRequests;
      const remainingRequests = Math.max(0, maxRequests - current);
      const resetTime = Date.now() + (windowSeconds * 1000);
      
      return { allowed, remainingRequests, resetTime };
    } catch (error) {
      logger.error(`RateLimit: Failed to check rate limit for ${identifier}`, error);
      return { allowed: true, remainingRequests: maxRequests, resetTime: Date.now() + (windowSeconds * 1000) };
    }
  }

  // Reset rate limit
  async resetRateLimit(identifier: string): Promise<boolean> {
    const key = `ratelimit:${identifier}`;
    return await this.cache.del(key);
  }
}

// Export service instances
export const cacheService = CacheService.getInstance();
export const pubSubService = PubSubService.getInstance();
export const sessionService = SessionService.getInstance();
export const rateLimitService = RateLimitService.getInstance();
EOF

# Create configuration index
echo "⚙️ Creating configuration management..."
cat > src/shared/config/index.ts << 'EOF'
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
EOF

# Create constants
echo "📋 Creating constants..."
cat > src/shared/config/constants.ts << 'EOF'
// WebRTC Signaling Constants

// Socket.io events
export const SOCKET_EVENTS = {
  // Connection events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',
  
  // Authentication events
  AUTH_REQUEST: 'auth:request',
  AUTH_SUCCESS: 'auth:success',
  AUTH_ERROR: 'auth:error',
  AUTH_REFRESH: 'auth:refresh',
  
  // Room events
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_CREATE: 'room:create',
  ROOM_UPDATE: 'room:update',
  ROOM_DELETE: 'room:delete',
  ROOM_LIST: 'room:list',
  ROOM_USERS: 'room:users',
  
  // WebRTC signaling events
  WEBRTC_OFFER: 'webrtc:offer',
  WEBRTC_ANSWER: 'webrtc:answer',
  WEBRTC_ICE_CANDIDATE: 'webrtc:ice-candidate',
  WEBRTC_PEER_JOINED: 'webrtc:peer-joined',
  WEBRTC_PEER_LEFT: 'webrtc:peer-left',
  
  // Media events
  MEDIA_STATE_CHANGE: 'media:state-change',
  SCREEN_SHARE_START: 'media:screen-share-start',
  SCREEN_SHARE_STOP: 'media:screen-share-stop',
  
  // Chat events
  CHAT_MESSAGE: 'chat:message',
  CHAT_TYPING: 'chat:typing',
  
  // Error events
  ERROR: 'error',
  VALIDATION_ERROR: 'validation:error',
} as const;

// Redis channels
export const REDIS_CHANNELS = {
  USER_EVENTS: 'user:events',
  ROOM_EVENTS: 'room:events',
  SIGNALING_EVENTS: 'signaling:events',
  SYSTEM_EVENTS: 'system:events',
} as const;

// Cache keys
export const CACHE_KEYS = {
  USER_SESSION: (userId: string) => `session:user:${userId}`,
  SOCKET_SESSION: (socketId: string) => `session:socket:${socketId}`,
  ROOM_SESSION: (roomId: string) => `session:room:${roomId}`,
  ROOM_PARTICIPANTS: (roomId: string) => `room:participants:${roomId}`,
  USER_ROOMS: (userId: string) => `user:rooms:${userId}`,
  REFRESH_TOKEN: (tokenId: string) => `refresh:token:${tokenId}`,
  RATE_LIMIT: (identifier: string) => `ratelimit:${identifier}`,
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// WebRTC configuration
export const WEBRTC_CONFIG = {
  ICE_GATHERING_TIMEOUT: 3000,
  CONNECTION_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
} as const;

// Room limits
export const ROOM_LIMITS = {
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_PARTICIPANTS: 8,
  MIN_PARTICIPANTS: 1,
  SESSION_TIMEOUT: 3600000, // 1 hour
} as const;

// User limits
export const USER_LIMITS = {
  MAX_USERNAME_LENGTH: 50,
  MIN_USERNAME_LENGTH: 3,
  MAX_DISPLAY_NAME_LENGTH: 100,
  MAX_EMAIL_LENGTH: 255,
  MIN_PASSWORD_LENGTH: 8,
  MAX_CONCURRENT_SESSIONS: 5,
} as const;

// Error codes
export const ERROR_CODES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  
  // Room errors
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  ROOM_FULL: 'ROOM_FULL',
  ROOM_PRIVATE: 'ROOM_PRIVATE',
  ROOM_CLOSED: 'ROOM_CLOSED',
  INVALID_ROOM_PASSWORD: 'INVALID_ROOM_PASSWORD',
  
  // Connection errors
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  PEER_CONNECTION_FAILED: 'PEER_CONNECTION_FAILED',
  SIGNALING_ERROR: 'SIGNALING_ERROR',
  
  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_DATA: 'INVALID_DATA',
  
  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

// Default permissions
export const DEFAULT_PERMISSIONS = {
  canSpeak: true,
  canVideo: true,
  canScreenShare: true,
  canChat: true,
  isModerator: false,
} as const;

// Media constraints
export const MEDIA_CONSTRAINTS = {
  AUDIO: {
    sampleRate: 48000,
    channelCount: 2,
    autoGainControl: true,
    echoCancellation: true,
    noiseSuppression: true,
  },
  VIDEO: {
    width: { min: 320, ideal: 1280, max: 1920 },
    height: { min: 240, ideal: 720, max: 1080 },
    frameRate: { min: 15, ideal: 30, max: 60 },
  },
} as const;

// Export types
export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
export type RedisChannel = typeof REDIS_CHANNELS[keyof typeof REDIS_CHANNELS];
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
export type HttpStatusCode = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];
EOF

# Create Redis module index
echo "📦 Creating Redis module index..."
cat > src/shared/redis/index.ts << 'EOF'
// Redis exports
export { 
  redisClient,
  connectRedis,
  checkRedisHealth,
  closeRedisConnection 
} from './connection';

export {
  CacheService,
  PubSubService,
  SessionService,
  RateLimitService,
  cacheService,
  pubSubService,
  sessionService,
  rateLimitService
} from './services';

export type { RedisClient } from './connection';
EOF

echo "✅ Redis & Configuration layer setup completed!"
echo "📋 Components created:"
echo "   ✓ Redis connection with health checks"
echo "   ✓ Cache service (get/set/del with TTL)"
echo "   ✓ Pub/Sub service for real-time events"
echo "   ✓ Session management service"
echo "   ✓ Rate limiting service"
echo "   ✓ Environment configuration with validation"
echo "   ✓ Application constants and error codes"
echo ""
echo "🔧 Services available:"
echo "   • CacheService - Key-value caching"
echo "   • PubSubService - Message broadcasting"
echo "   • SessionService - User/Socket/Room sessions"
echo "   • RateLimitService - Request rate limiting"
echo ""
echo "📝 Next: Run ./04-shared-types-utils.sh"

  