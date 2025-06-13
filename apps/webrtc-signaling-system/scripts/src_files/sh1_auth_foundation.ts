// src/auth/index.ts
import type { FastifyInstance } from 'fastify';
import authRoutes from './routes/auth.routes';
import { logger } from '../shared/utils/logger';

export default async function authPlugin(fastify: FastifyInstance) {
  logger.info('Registering auth plugin');
  
  // Register auth routes with prefix
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  
  logger.info('Auth plugin registered successfully');
}

// src/auth/types.ts
import { User } from '../shared/types/user';

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface ValidateRequest {
  accessToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface ValidateResponse {
  valid: boolean;
  user?: User;
}

export interface LogoutResponse {
  success: boolean;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

// JWT payload interfaces
export interface AccessTokenPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  iat: number;
  exp: number;
}