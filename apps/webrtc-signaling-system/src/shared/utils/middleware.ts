import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import {  ZodError } from 'zod';
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
    let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    let errorCode: string = ERROR_CODES.INTERNAL_ERROR;
    let message:string = 'Internal Server Error';
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
  request=request;
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
    ip = ips?.split(',')[0]?.trim() || ip;
  } else if (realIP) {
     const resolvedIP = Array.isArray(realIP) ? realIP[0] : realIP;
    ip = resolvedIP ?? ip;
  } else if (clientIP) {
    const resolvedIP = Array.isArray(clientIP) ? clientIP[0] : clientIP;
    ip = resolvedIP ?? ip;
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
export function createValidationMiddleware(schema: any) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const validatedData = schema.parse(request.body);
      (request as any).validatedBody = validatedData;
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
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
  _request: FastifyRequest,
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
