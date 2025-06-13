import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../utils/jwt';
import { findUserById } from '../services/user.service';
import { logger } from '../../shared/utils/logger';

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      name: string;
    };
  }
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid authorization header');
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
        statusCode: 401
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const payload = verifyAccessToken(token);
    
    if (!payload) {
      logger.warn('Invalid access token provided');
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid access token',
        statusCode: 401
      });
    }

    // Verify user still exists
    const user = await findUserById(payload.userId);
    if (!user) {
      logger.warn(`User not found for token: ${payload.userId}`);
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'User not found',
        statusCode: 401
      });
    }

    // Attach user to request
    request.user = {
      id: user.id,
      email: user.email,
      name: user.name
    };

    logger.debug(`User authenticated: ${user.email}`);
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Authentication error',
      statusCode: 500
    });
  }
}
