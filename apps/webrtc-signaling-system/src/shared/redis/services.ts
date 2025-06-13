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
