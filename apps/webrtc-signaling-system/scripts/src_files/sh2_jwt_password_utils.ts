// src/auth/utils/jwt.ts
import jwt from 'jsonwebtoken';
import { AccessTokenPayload, RefreshTokenPayload } from '../types';
import { logger } from '../../shared/utils/logger';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const ACCESS_TOKEN_EXPIRES_IN = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // 7 days

export function generateAccessToken(userId: string, email: string): string {
  try {
    const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
      userId,
      email
    };
    
    return jwt.sign(payload, JWT_ACCESS_SECRET, { 
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      issuer: 'webrtc-signaling'
    });
  } catch (error) {
    logger.error('Error generating access token:', error);
    throw new Error('Failed to generate access token');
  }
}

export function generateRefreshToken(userId: string, tokenId: string): string {
  try {
    const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
      userId,
      tokenId
    };
    
    return jwt.sign(payload, JWT_REFRESH_SECRET, { 
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
      issuer: 'webrtc-signaling'
    });
  } catch (error) {
    logger.error('Error generating refresh token:', error);
    throw new Error('Failed to generate refresh token');
  }
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as AccessTokenPayload;
    return decoded;
  } catch (error) {
    logger.warn('Invalid access token:', error.message);
    return null;
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
    return decoded;
  } catch (error) {
    logger.warn('Invalid refresh token:', error.message);
    return null;
  }
}

// src/auth/utils/password.ts
import bcrypt from 'bcrypt';
import { logger } from '../../shared/utils/logger';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    logger.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    logger.error('Error comparing password:', error);
    throw new Error('Failed to compare password');
  }
}

// src/auth/middleware/auth.ts
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