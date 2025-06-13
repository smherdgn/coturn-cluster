#!/bin/bash

# WebRTC Signaling Server - Security & Middleware Setup
echo "🔒 Setting up Security & Middleware layer..."

# Ensure we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run from signaling-server directory."
    exit 1
fi

# Create security configuration
echo "🛡️ Creating security configuration..."
cat > src/shared/config/security.ts << 'EOF'
import { config } from './index';

// Security configuration
export const securityConfig = {
  // Helmet configuration for security headers
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // Required for Socket.IO admin UI
          "'unsafe-eval'", // Required for some WebRTC operations
          "https://cdnjs.cloudflare.com", // For CDN resources
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Required for Socket.IO admin UI
          "https://fonts.googleapis.com",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https:",
          "blob:", // Required for WebRTC media streams
        ],
        connectSrc: [
          "'self'",
          "ws:",
          "wss:",
          "https:", // For STUN/TURN servers
          config.cors.origin.join(' '),
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
        ],
        objectSrc: ["'none'"],
        mediaSrc: [
          "'self'",
          "blob:", // Required for WebRTC media
        ],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: config.env === 'production' ? [] : null,
      },
      reportOnly: config.env === 'development',
    },
    crossOriginEmbedderPolicy: {
      policy: "credentialless", // Required for SharedArrayBuffer in WebRTC
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    originAgentCluster: true,
    dnsPrefetchControl: {
      allow: false,
    },
    frameguard: {
      action: 'deny',
    },
    permittedCrossDomainPolicies: false,
    hidePoweredBy: true,
    xssFilter: true,
  },

  // CORS configuration
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      if (config.cors.origin.includes(origin)) {
        return callback(null, true);
      }
      
      // In development, allow localhost with any port
      if (config.env === 'development') {
        const localhostRegex = /^https?:\/\/localhost(:\d+)?$/;
        const ip127Regex = /^https?:\/\/127\.0\.0\.1(:\d+)?$/;
        
        if (localhostRegex.test(origin) || ip127Regex.test(origin)) {
          return callback(null, true);
        }
      }
      
      callback(new Error('Not allowed by CORS'), false);
    },
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-HTTP-Method-Override',
      'Accept',
      'Cache-Control',
      'Pragma',
    ],
    exposedHeaders: [
      'X-Total-Count',
      'X-Page-Count',
      'X-Rate-Limit-Limit',
      'X-Rate-Limit-Remaining',
      'X-Rate-Limit-Reset',
    ],
    maxAge: 86400, // 24 hours
    optionsSuccessStatus: 200,
    preflightContinue: false,
  },

  // Rate limiting configuration
  rateLimit: {
    global: {
      max: config.rateLimit.max,
      timeWindow: config.rateLimit.windowMs,
      allowList: ['127.0.0.1', '::1'], // Localhost exemption
      errorResponseBuilder: (request: any, context: any) => ({
        success: false,
        error: 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
        limit: context.max,
        remaining: context.remaining,
        resetTime: new Date(Date.now() + context.ttl),
        retryAfter: Math.round(context.ttl / 1000),
        timestamp: new Date(),
      }),
      addHeaders: {
        'x-ratelimit-limit': true,
        'x-ratelimit-remaining': true,
        'x-ratelimit-reset': true,
        'retry-after': true,
      },
      skipOnError: true,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },
    
    // Specific rate limits for different endpoints
    auth: {
      max: 10, // 10 login attempts
      timeWindow: 15 * 60 * 1000, // 15 minutes
      skipSuccessfulRequests: true,
    },
    
    api: {
      max: 200, // 200 API calls
      timeWindow: 15 * 60 * 1000, // 15 minutes
    },
    
    socket: {
      max: 1000, // 1000 socket events
      timeWindow: 60 * 1000, // 1 minute
    },
  },

  // Trusted proxies configuration
  trustedProxies: [
    '127.0.0.1',
    '::1',
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    'fc00::/7',
  ],

  // Session security
  session: {
    name: 'webrtc.sid',
    secret: config.jwt.secret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: config.env === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict',
    },
  },
} as const;

// Security headers for static files
export const staticSecurityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': [
    'camera=self',
    'microphone=self',
    'display-capture=self',
    'geolocation=(),
    'payment=(),
    'usb=()',
  ].join(', '),
} as const;
EOF

# Create middleware utilities
echo "⚙️ Creating middleware utilities..."
cat > src/shared/utils/middleware.ts << 'EOF'
import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { ZodError } from 'zod';
import { logger } from './logger';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';
import { config } from '../config';
import type { ErrorResponse } from '../types';

// Request ID generator
export function generateRequestId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Request logging middleware
export async function requestLogger(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const start = Date.now();
  const requestId = generateRequestId();
  
  // Add request ID to headers
  reply.header('X-Request-ID', requestId);
  
  // Log request
  logger.info(`${request.method} ${request.url} - Request started`, {
    requestId,
    method: request.method,
    url: request.url,
    userAgent: request.headers['user-agent'],
    ip: request.ip,
    referer: request.headers.referer,
  });

  // Log response when finished
  reply.raw.on('finish', () => {
    const duration = Date.now() - start;
    const level = reply.statusCode >= 400 ? 'error' : 
                 reply.statusCode >= 300 ? 'warn' : 'info';
    
    logger.log(level, `${request.method} ${request.url} - ${reply.statusCode} - ${duration}ms`, {
      requestId,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration,
      contentLength: reply.getHeader('content-length'),
      ip: request.ip,
    });
  });
}

// Error handler
export function createErrorHandler() {
  return (
    error: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply
  ): void => {
    const requestId = reply.getHeader('X-Request-ID') as string;
    
    // Log error with context
    logger.error('Request error:', error, {
      requestId,
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      body: request.body,
      params: request.params,
      query: request.query,
    });

    // Handle specific error types
    let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    let errorCode = ERROR_CODES.INTERNAL_ERROR;
    let message = 'Internal Server Error';
    let details: any = undefined;

    if (error.validation) {
      // Fastify validation error
      statusCode = HTTP_STATUS.BAD_REQUEST;
      errorCode = ERROR_CODES.VALIDATION_FAILED;
      message = 'Validation failed';
      details = error.validation;
    } else if (error instanceof ZodError) {
      // Zod validation error
      statusCode = HTTP_STATUS.BAD_REQUEST;
      errorCode = ERROR_CODES.VALIDATION_FAILED;
      message = 'Validation failed';
      details = error.errors;
    } else if (error.statusCode) {
      // HTTP error with status code
      statusCode = error.statusCode;
      
      switch (statusCode) {
        case HTTP_STATUS.UNAUTHORIZED:
          errorCode = ERROR_CODES.TOKEN_INVALID;
          message = 'Authentication required';
          break;
        case HTTP_STATUS.FORBIDDEN:
          errorCode = ERROR_CODES.TOKEN_INVALID;
          message = 'Access forbidden';
          break;
        case HTTP_STATUS.NOT_FOUND:
          errorCode = 'NOT_FOUND';
          message = 'Resource not found';
          break;
        case HTTP_STATUS.TOO_MANY_REQUESTS:
          errorCode = ERROR_CODES.RATE_LIMIT_EXCEEDED;
          message = 'Rate limit exceeded';
          break;
        default:
          message = error.message || message;
      }
    }

    // Don't expose internal errors in production
    if (config.env === 'production' && statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR) {
      message = 'Internal Server Error';
      details = undefined;
    }

    const errorResponse: ErrorResponse = {
      success: false,
      error: message,
      code: errorCode,
      ...(details && { details }),
      timestamp: new Date(),
    };

    reply.status(statusCode).send(errorResponse);
  };
}

// Security headers middleware
export async function securityHeaders(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Remove server header
  reply.removeHeader('X-Powered-By');
  
  // Add security headers
  reply.header('X-Request-ID', reply.getHeader('X-Request-ID'));
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-Frame-Options', 'DENY');
  reply.header('X-XSS-Protection', '1; mode=block');
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add permissions policy for WebRTC features
  reply.header('Permissions-Policy', [
    'camera=self',
    'microphone=self',
    'display-capture=self',
    'geolocation=()',
    'payment=()',
    'usb=()',
  ].join(', '));
}

// IP validation middleware
export function validateClientIP(request: FastifyRequest): string {
  const forwardedFor = request.headers['x-forwarded-for'];
  const realIP = request.headers['x-real-ip'];
  const clientIP = request.headers['x-client-ip'];

  let ip = request.ip;

  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    ip = ips.split(',')[0].trim();
  } else if (realIP) {
    ip = Array.isArray(realIP) ? realIP[0] : realIP;
  } else if (clientIP) {
    ip = Array.isArray(clientIP) ? clientIP[0] : clientIP;
  }

  // Validate IP format
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
    logger.warn('Invalid IP format detected', { ip, headers: request.headers });
    return 'unknown';
  }

  return ip;
}

// Request validation middleware
export function createValidationMiddleware<T>(schema: any) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const validatedData = schema.parse(request.body);
      (request as any).validatedBody = validatedData;
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: err.input,
        }));

        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: 'Validation failed',
          code: ERROR_CODES.VALIDATION_FAILED,
          details: validationErrors,
          timestamp: new Date(),
        });
        return;
      }
      throw error;
    }
  };
}

// Authentication middleware placeholder
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(HTTP_STATUS.UNAUTHORIZED).send({
      success: false,
      error: 'Authentication required',
      code: ERROR_CODES.TOKEN_INVALID,
      timestamp: new Date(),
    });
    return;
  }

  // TODO: Implement JWT token validation
  // This will be implemented in the auth module
  const token = authHeader.substring(7);
  
  try {
    // Placeholder for token validation
    // const user = await validateJWTToken(token);
    // (request as any).user = user;
    
    logger.debug('Auth middleware - token validation placeholder', { token: token.substring(0, 10) + '...' });
  } catch (error) {
    reply.status(HTTP_STATUS.UNAUTHORIZED).send({
      success: false,
      error: 'Invalid token',
      code: ERROR_CODES.TOKEN_INVALID,
      timestamp: new Date(),
    });
    return;
  }
}

// CORS preflight handler
export async function handlePreflight(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (request.method === 'OPTIONS') {
    reply
      .status(200)
      .header('Access-Control-Max-Age', '86400') // 24 hours
      .send();
  }
}

// Health check middleware
export async function healthCheck(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Basic health indicators
  const health = {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
  };

  reply.status(HTTP_STATUS.OK).send(health);
}
EOF

# Create rate limiting service
echo "🚦 Creating rate limiting service..."
cat > src/shared/utils/rateLimiter.ts << 'EOF'
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
EOF

# Create security validation schemas
echo "🔍 Creating security validation schemas..."
cat > src/shared/utils/validation.ts << 'EOF'
import { z } from 'zod';
import { USER_LIMITS, ROOM_LIMITS } from '../config/constants';

// Common validation patterns
const email = z.string()
  .email('Invalid email format')
  .max(USER_LIMITS.MAX_EMAIL_LENGTH, `Email too long (max ${USER_LIMITS.MAX_EMAIL_LENGTH} characters)`);

const password = z.string()
  .min(USER_LIMITS.MIN_PASSWORD_LENGTH, `Password too short (min ${USER_LIMITS.MIN_PASSWORD_LENGTH} characters)`)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and numbers');

const username = z.string()
  .min(USER_LIMITS.MIN_USERNAME_LENGTH, `Username too short (min ${USER_LIMITS.MIN_USERNAME_LENGTH} characters)`)
  .max(USER_LIMITS.MAX_USERNAME_LENGTH, `Username too long (max ${USER_LIMITS.MAX_USERNAME_LENGTH} characters)`)
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscore, and dash');

const roomName = z.string()
  .min(1, 'Room name is required')
  .max(ROOM_LIMITS.MAX_NAME_LENGTH, `Room name too long (max ${ROOM_LIMITS.MAX_NAME_LENGTH} characters)`)
  .trim();

// Security validation schemas
export const securitySchemas = {
  // Auth schemas
  login: z.object({
    email,
    password: z.string().min(1, 'Password is required'),
    deviceInfo: z.object({
      userAgent: z.string().optional(),
      platform: z.string().optional(),
      ip: z.string().optional(),
    }).optional(),
  }),

  register: z.object({
    email,
    username,
    password,
    displayName: z.string()
      .max(USER_LIMITS.MAX_DISPLAY_NAME_LENGTH, `Display name too long (max ${USER_LIMITS.MAX_DISPLAY_NAME_LENGTH} characters)`)
      .optional(),
    deviceInfo: z.object({
      userAgent: z.string().optional(),
      platform: z.string().optional(),
      ip: z.string().optional(),
    }).optional(),
  }),

  refreshToken: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: password,
  }),

  // Room schemas
  createRoom: z.object({
    name: roomName,
    description: z.string()
      .max(ROOM_LIMITS.MAX_DESCRIPTION_LENGTH, `Description too long (max ${ROOM_LIMITS.MAX_DESCRIPTION_LENGTH} characters)`)
      .optional(),
    settings: z.object({
      audioEnabled: z.boolean().optional(),
      videoEnabled: z.boolean().optional(),
      screenShareEnabled: z.boolean().optional(),
      chatEnabled: z.boolean().optional(),
      moderationEnabled: z.boolean().optional(),
      maxParticipants: z.number()
        .min(ROOM_LIMITS.MIN_PARTICIPANTS)
        .max(ROOM_LIMITS.MAX_PARTICIPANTS)
        .optional(),
      isPrivate: z.boolean().optional(),
      requirePassword: z.boolean().optional(),
    }).optional(),
    password: z.string().min(4, 'Room password must be at least 4 characters').optional(),
  }),

  joinRoom: z.object({
    roomId: z.string().uuid('Invalid room ID'),
    password: z.string().optional(),
    userPermissions: z.object({
      canSpeak: z.boolean().optional(),
      canVideo: z.boolean().optional(),
      canScreenShare: z.boolean().optional(),
      canChat: z.boolean().optional(),
      isModerator: z.boolean().optional(),
    }).optional(),
  }),

  // WebRTC schemas
  webrtcOffer: z.object({
    roomId: z.string().uuid('Invalid room ID'),
    targetUserId: z.string().uuid('Invalid target user ID'),
    offer: z.object({
      type: z.literal('offer'),
      sdp: z.string().min(1, 'SDP is required'),
    }),
    metadata: z.object({
      audio: z.boolean(),
      video: z.boolean(),
      screenShare: z.boolean(),
    }).optional(),
  }),

  webrtcAnswer: z.object({
    roomId: z.string().uuid('Invalid room ID'),
    targetUserId: z.string().uuid('Invalid target user ID'),
    answer: z.object({
      type: z.literal('answer'),
      sdp: z.string().min(1, 'SDP is required'),
    }),
  }),

  webrtcIceCandidate: z.object({
    roomId: z.string().uuid('Invalid room ID'),
    targetUserId: z.string().uuid('Invalid target user ID'),
    candidate: z.object({
      candidate: z.string(),
      sdpMLineIndex: z.number().optional(),
      sdpMid: z.string().optional(),
    }),
  }),

  // Chat schemas
  chatMessage: z.object({
    roomId: z.string().uuid('Invalid room ID'),
    message: z.string()
      .min(1, 'Message cannot be empty')
      .max(1000, 'Message too long (max 1000 characters)')
      .trim(),
    messageType: z.enum(['text', 'system']).optional(),
    metadata: z.object({
      mentions: z.array(z.string().uuid()).optional(),
      attachments: z.array(z.string()).optional(),
    }).optional(),
  }),
};

// Sanitization functions
export const sanitizers = {
  // Sanitize HTML input
  html: (input: string): string => {
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  },

  // Sanitize SQL input (basic)
  sql: (input: string): string => {
    return input
      .replace(/['";\\]/g, '') // Remove SQL injection characters
      .trim();
  },

  // Sanitize room name
  roomName: (input: string): string => {
    return input
      .replace(/[^\w\s-]/g, '') // Only allow word characters, spaces, and dashes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  },

  // Sanitize username
  username: (input: string): string => {
    return input
      .replace(/[^\w-]/g, '') // Only allow word characters and dashes
      .toLowerCase()
      .trim();
  },
};

// Input validation middleware factory
export function createValidationMiddleware(schema: z.ZodSchema) {
  return async (request: any, reply: any) => {
    try {
      const validatedData = schema.parse(request.body);
      request.validatedBody = validatedData;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: err.input,
        }));

        reply.status(400).send({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_FAILED',
          details: validationErrors,
          timestamp: new Date(),
        });
        return;
      }
      throw error;
    }
  };
}
EOF

# Update shared utils index
echo "📦 Updating shared utils index..."
cat > src/shared/utils/index.ts << 'EOF'
// Utility exports
export { logger, Logger, defaultLogger, logError, logWarn, logInfo, logDebug, createRequestLogger, httpLogStream } from './logger';
export * from './helpers';
export * from './middleware';
export { RateLimiter, rateLimiters } from './rateLimiter';
export { securitySchemas, sanitizers, createValidationMiddleware } from './validation';
EOF

# Update shared config index to include security
echo "📦 Updating shared config index..."
cat >> src/shared/config/index.ts << 'EOF'

// Export security configuration
export { securityConfig } from './security';
EOF

echo "✅ Security & Middleware layer setup completed!"
echo "📋 Security components created:"
echo "   ✓ Comprehensive security configuration"
echo "   ✓ Helmet CSP with WebRTC support"
echo "   ✓ CORS configuration with origin validation"
echo "   ✓ Rate limiting with Redis backend"
echo "   ✓ Request logging and error handling"
echo "   ✓ Input validation with Zod schemas"
echo "   ✓ Security headers middleware"
echo "   ✓ IP validation and sanitization"
echo ""
echo "🔒 Security features configured:"
echo "   • Content Security Policy for WebRTC"
echo "   • Rate limiting (global, auth, API, socket)"
echo "   • Request/response logging with IDs"
echo "   • Input sanitization and validation"
echo "   • Error handling with proper status codes"
echo "   • Security headers (XSS, CSRF, etc.)"
echo "   • CORS with origin validation"
echo "   • IP-based rate limiting"
echo ""
echo "🛡️ Rate Limits configured:"
echo "   • Global: 100 requests/15min"
echo "   • Auth: 10 attempts/15min"
echo "   • API: 200 requests/15min"
echo "   • Socket: 1000 events/1min"
echo "   • Register: 3 attempts/hour"
echo ""
echo "🔧 Middleware available:"
echo "   • requestLogger - HTTP request logging"
echo "   • createErrorHandler - Global error handling"
echo "   • securityHeaders - Security headers"
echo "   • requireAuth - JWT authentication (placeholder)"
echo "   • createValidationMiddleware - Input validation"
echo "   • rateLimiters.* - Various rate limiters"
echo ""
echo "📝 Usage in server.ts:"
echo "   import { securityConfig, rateLimiters, createErrorHandler } from './shared';"
echo "   fastify.register(helmet, securityConfig.helmet);"
echo "   fastify.register(cors, securityConfig.cors);"
echo "   fastify.addHook('preHandler', rateLimiters.global.middleware());"
echo "   fastify.setErrorHandler(createErrorHandler());"
echo ""
echo "📋 Next: Integrate these middleware in your server.ts file"