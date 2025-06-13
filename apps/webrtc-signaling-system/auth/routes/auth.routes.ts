import type { FastifyInstance } from 'fastify';
import { 
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  profileHandler,
  validateHandler
} from '../controllers/auth.controller';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  profileSchema,
  validateSchema
} from '../schemas/validation';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../../shared/utils/logger';

export default async function authRoutes(fastify: FastifyInstance) {
  logger.info('Registering auth routes');

  // POST /api/auth/register
  // Register a new user
  fastify.post('/register', {
    schema: registerSchema,
    handler: registerHandler
  });

  // POST /api/auth/login
  // Login with email and password
  fastify.post('/login', {
    schema: loginSchema,
    handler: loginHandler
  });

  // POST /api/auth/refresh
  // Refresh access token using refresh token
  fastify.post('/refresh', {
    schema: refreshSchema,
    handler: refreshHandler
  });

  // POST /api/auth/logout
  // Logout user (requires both access and refresh tokens)
  fastify.post('/logout', {
    schema: logoutSchema,
    preHandler: [authMiddleware],
    handler: logoutHandler
  });

  // GET /api/auth/profile
  // Get user profile (requires authentication)
  fastify.get('/profile', {
    schema: profileSchema,
    preHandler: [authMiddleware],
    handler: profileHandler
  });

  // POST /api/auth/validate
  // Validate access token
  fastify.post('/validate', {
    schema: validateSchema,
    handler: validateHandler
  });

  // Rate limiting hooks for auth endpoints
  fastify.addHook('preHandler', async (request, reply) => {
    const clientIp = request.ip;
    const endpoint = request.routerPath;
    
    // Apply rate limiting for login and register endpoints
    if (endpoint === '/login' || endpoint === '/register') {
      const redisKey = `rate_limit:${endpoint}:${clientIp}`;
      const redisClient = fastify.redis;
      
      try {
        const attempts = await redisClient.incr(redisKey);
        
        if (attempts === 1) {
          // Set expiry for first attempt (15 minutes)
          await redisClient.expire(redisKey, 900);
        }
        
        // Allow max 5 attempts per 15 minutes for login/register
        if (attempts > 5) {
          logger.warn(`Rate limit exceeded for ${endpoint} from IP: ${clientIp}`);
          return reply.status(429).send({
            error: 'Too Many Requests',
            message: 'Too many attempts. Please try again later.',
            statusCode: 429
          });
        }
      } catch (error) {
        logger.error('Rate limiting error:', error);
        // Continue without rate limiting if Redis fails
      }
    }
  });

  // Error handler for auth routes
  fastify.setErrorHandler(async (error, request, reply) => {
    logger.error('Auth route error:', {
      error: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method,
      ip: request.ip
    });

    // Handle validation errors
    if (error.validation) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid request data',
        statusCode: 400,
        details: error.validation
      });
    }

    // Handle specific known errors
    if (error.message.includes('User already exists')) {
      return reply.status(409).send({
        error: 'Conflict',
        message: 'User already exists with this email',
        statusCode: 409
      });
    }

    if (error.message.includes('Invalid email or password')) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid email or password',
        statusCode: 401
      });
    }

    if (error.message.includes('Invalid') && error.message.includes('token')) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
        statusCode: 401
      });
    }

    // Default error response
    reply.status(500).send({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      statusCode: 500
    });
  });

  logger.info('Auth routes registered successfully');
}
