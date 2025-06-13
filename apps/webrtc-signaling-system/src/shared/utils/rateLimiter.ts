import { FastifyRequest, FastifyReply } from 'fastify';
import { rateLimitService } from '../redis';
import { HTTP_STATUS } from '../config/constants';
import { validateClientIP } from './middleware';
import { logger } from './logger';

export interface RateLimitOptions {
  max: number;
  windowMs: number;
  keyGenerator?: (request: FastifyRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  onLimitReached?: (request: FastifyRequest, reply: FastifyReply) => void;
}

export class RateLimiter {
  private options: Required<RateLimitOptions>;

  constructor(options: RateLimitOptions) {
    this.options = {
      keyGenerator: (request: FastifyRequest) => validateClientIP(request),
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      onLimitReached: () => {},
      ...options,
    };
  }

  // Create rate limiting middleware
  middleware() {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const key = this.options.keyGenerator(request);
      const windowSeconds = Math.floor(this.options.windowMs / 1000);

      try {
        const result = await rateLimitService.checkRateLimit(
          `ratelimit:${key}`,
          this.options.max,
          windowSeconds
        );

        // Add rate limit headers
        reply.header('X-RateLimit-Limit', this.options.max);
        reply.header('X-RateLimit-Remaining', result.remainingRequests);
        reply.header('X-RateLimit-Reset', Math.floor(result.resetTime / 1000));

        if (!result.allowed) {
          this.options.onLimitReached(request, reply);
          
          logger.warn('Rate limit exceeded', {
            ip: key,
            limit: this.options.max,
            window: this.options.windowMs,
            url: request.url,
            method: request.method,
          });

          reply.status(HTTP_STATUS.TOO_MANY_REQUESTS).send({
            success: false,
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            limit: this.options.max,
            remaining: result.remainingRequests,
            resetTime: new Date(result.resetTime),
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
            timestamp: new Date(),
          });
          return;
        }

        // Track response for conditional counting
        if (this.options.skipSuccessfulRequests || this.options.skipFailedRequests) {
          reply.raw.on('finish', () => {
            const statusCode = reply.statusCode;
            const isSuccess = statusCode < 400;
            const isFailure = statusCode >= 400;

            if ((this.options.skipSuccessfulRequests && isSuccess) ||
                (this.options.skipFailedRequests && isFailure)) {
              // Compensate for the increment by decrementing
              rateLimitService.rateLimitService.cache.increment(`ratelimit:${key}`, -1)
                .catch(error => logger.error('Failed to adjust rate limit counter', error));
            }
          });
        }

      } catch (error) {
        logger.error('Rate limiting error', error);
        // Allow request on rate limiting service failure
      }
    };
  }

  // Reset rate limit for a specific key
  async reset(key: string): Promise<boolean> {
    try {
      return await rateLimitService.resetRateLimit(`ratelimit:${key}`);
    } catch (error) {
      logger.error('Failed to reset rate limit', error);
      return false;
    }
  }
}

// Pre-configured rate limiters
export const rateLimiters = {
  // Global rate limiter
  global: new RateLimiter({
    max: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  }),

  // Auth rate limiter (stricter)
  auth: new RateLimiter({
    max: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
    skipSuccessfulRequests: true,
    keyGenerator: (request) => `auth:${validateClientIP(request)}`,
  }),

  // API rate limiter
  api: new RateLimiter({
    max: 200,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyGenerator: (request) => `api:${validateClientIP(request)}`,
  }),

  // Socket rate limiter
  socket: new RateLimiter({
    max: 1000,
    windowMs: 60 * 1000, // 1 minute
    keyGenerator: (request) => `socket:${validateClientIP(request)}`,
  }),

  // Registration rate limiter (very strict)
  register: new RateLimiter({
    max: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyGenerator: (request) => `register:${validateClientIP(request)}`,
  }),
};
