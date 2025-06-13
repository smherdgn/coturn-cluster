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
