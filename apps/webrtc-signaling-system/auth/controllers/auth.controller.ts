import type { FastifyRequest, FastifyReply } from 'fastify';
import { 
  RegisterRequest, 
  LoginRequest, 
  RefreshRequest, 
  ValidateRequest,
  AuthResponse,
  RefreshResponse,
  ValidateResponse,
  LogoutResponse,
  ErrorResponse 
} from '../types';
import { 
  register, 
  login, 
  refreshToken, 
  logout, 
  validateToken 
} from '../services/auth.service';
import { findUserById } from '../services/user.service';
import { logger } from '../../shared/utils/logger';

export const registerHandler = async (
  request: FastifyRequest<{ Body: RegisterRequest }>, 
  reply: FastifyReply
): Promise<void> => {
  try {
    const { email, password, name } = request.body;

    // Validate input
    if (!email || !password || !name) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Email, password, and name are required',
        statusCode: 400
      } as ErrorResponse);
    }

    if (password.length < 6) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Password must be at least 6 characters long',
        statusCode: 400
      } as ErrorResponse);
    }

    const result = await register(email, password, name);
    
    logger.info(`Registration successful for: ${email}`);
    
    reply.status(201).send({
      user: result.user,
      accessToken: result.tokens.access,
      refreshToken: result.tokens.refresh
    } as AuthResponse);

  } catch (error) {
    logger.error('Registration handler error:', error);
    
    const statusCode = error.message.includes('already exists') ? 409 : 500;
    const errorMessage = error.message.includes('already exists') 
      ? 'User already exists with this email'
      : 'Internal server error';

    reply.status(statusCode).send({
      error: statusCode === 409 ? 'Conflict' : 'Internal Server Error',
      message: errorMessage,
      statusCode
    } as ErrorResponse);
  }
};

export const loginHandler = async (
  request: FastifyRequest<{ Body: LoginRequest }>, 
  reply: FastifyReply
): Promise<void> => {
  try {
    const { email, password } = request.body;

    // Validate input
    if (!email || !password) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Email and password are required',
        statusCode: 400
      } as ErrorResponse);
    }

    const result = await login(email, password);
    
    logger.info(`Login successful for: ${email}`);
    
    reply.status(200).send({
      user: result.user,
      accessToken: result.tokens.access,
      refreshToken: result.tokens.refresh
    } as AuthResponse);

  } catch (error) {
    logger.error('Login handler error:', error);
    
    const statusCode = error.message.includes('Invalid email or password') ? 401 : 500;
    const errorMessage = error.message.includes('Invalid email or password')
      ? 'Invalid email or password'
      : 'Internal server error';

    reply.status(statusCode).send({
      error: statusCode === 401 ? 'Unauthorized' : 'Internal Server Error',
      message: errorMessage,
      statusCode
    } as ErrorResponse);
  }
};

export const refreshHandler = async (
  request: FastifyRequest<{ Body: RefreshRequest }>, 
  reply: FastifyReply
): Promise<void> => {
  try {
    const { refreshToken: refreshTokenValue } = request.body;

    // Validate input
    if (!refreshTokenValue) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Refresh token is required',
        statusCode: 400
      } as ErrorResponse);
    }

    const result = await refreshToken(refreshTokenValue);
    
    logger.info('Token refresh successful');
    
    reply.status(200).send({
      accessToken: result.accessToken
    } as RefreshResponse);

  } catch (error) {
    logger.error('Refresh handler error:', error);
    
    const statusCode = error.message.includes('Invalid') || error.message.includes('expired') ? 401 : 500;
    const errorMessage = error.message.includes('Invalid') || error.message.includes('expired')
      ? 'Invalid or expired refresh token'
      : 'Internal server error';

    reply.status(statusCode).send({
      error: statusCode === 401 ? 'Unauthorized' : 'Internal Server Error',
      message: errorMessage,
      statusCode
    } as ErrorResponse);
  }
};

export const logoutHandler = async (
  request: FastifyRequest, 
  reply: FastifyReply
): Promise<void> => {
  try {
    const authHeader = request.headers.authorization;
    const refreshTokenHeader = request.headers['x-refresh-token'] as string;

    if (!refreshTokenHeader) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Refresh token header (x-refresh-token) is required',
        statusCode: 400
      } as ErrorResponse);
    }

    await logout(refreshTokenHeader);
    
    logger.info('Logout successful');
    
    reply.status(200).send({
      success: true
    } as LogoutResponse);

  } catch (error) {
    logger.error('Logout handler error:', error);
    
    reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Internal server error',
      statusCode: 500
    } as ErrorResponse);
  }
};

export const profileHandler = async (
  request: FastifyRequest, 
  reply: FastifyReply
): Promise<void> => {
  try {
    // User is attached by auth middleware
    if (!request.user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
        statusCode: 401
      } as ErrorResponse);
    }

    // Get full user data
    const user = await findUserById(request.user.id);
    if (!user) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'User not found',
        statusCode: 404
      } as ErrorResponse);
    }

    logger.info(`Profile retrieved for: ${user.email}`);
    
    reply.status(200).send({
      user
    });

  } catch (error) {
    logger.error('Profile handler error:', error);
    
    reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Internal server error',
      statusCode: 500
    } as ErrorResponse);
  }
};

export const validateHandler = async (
  request: FastifyRequest<{ Body: ValidateRequest }>, 
  reply: FastifyReply
): Promise<void> => {
  try {
    const { accessToken } = request.body;

    // Validate input
    if (!accessToken) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Access token is required',
        statusCode: 400
      } as ErrorResponse);
    }

    const result = await validateToken(accessToken);
    
    logger.info(`Token validation: ${result.valid ? 'valid' : 'invalid'}`);
    
    reply.status(200).send({
      valid: result.valid,
      user: result.user
    } as ValidateResponse);

  } catch (error) {
    logger.error('Validate handler error:', error);
    
    reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Internal server error',
      statusCode: 500
    } as ErrorResponse);
  }
};

