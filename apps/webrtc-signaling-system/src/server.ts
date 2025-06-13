import Fastify, { FastifyInstance } from 'fastify';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';

import { config } from './shared/config';
import { logger, Logger } from './shared/utils/logger';
import { connectRedis, redisClient, checkRedisHealth } from './shared/redis';
import { checkDatabaseHealth } from './shared/database';
import { SOCKET_EVENTS, HTTP_STATUS } from './shared/config/constants';
import type { AuthenticatedSocket, HealthCheckResponse } from './shared/types';

// Create logger for server
const serverLogger = new Logger('Server');

// Create Fastify instance
const fastify: FastifyInstance = Fastify({
  logger: {
    level: config.logging.level,
    stream: {
      write: (msg: string) => {
        logger.info(msg.trim());
      },
    },
  },
  trustProxy: true,
  bodyLimit: 1048576, // 1MB
  keepAliveTimeout: 30000,
  connectionTimeout: 60000,
});

// Global error handler
fastify.setErrorHandler(async (error, request, reply) => {
  serverLogger.error('Unhandled error:', error, {
    url: request.url,
    method: request.method,
    ip: request.ip,
  });

  const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  
  return reply.status(statusCode).send({
    success: false,
    error: config.env === 'production' ? 'Internal Server Error' : error.message,
    code: 'INTERNAL_ERROR',
    timestamp: new Date(),
  });
});

// Register plugins
async function registerPlugins(): Promise<void> {
  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
      },
    },
  });

  // CORS configuration
  await fastify.register(cors, {
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.windowMs,
    errorResponseBuilder: (_request, context) => ({
      success: false,
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.round(context.ttl / 1000),
      timestamp: new Date(),
    }),
  });

  serverLogger.info('✅ Fastify plugins registered');
}

// Health check route
fastify.get('/health', async (_request, reply) => {
  const [dbHealth, redisHealth] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
  ]);

  const isHealthy = dbHealth && redisHealth;
  const statusCode = isHealthy ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE;

  const response: HealthCheckResponse = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    uptime: process.uptime(),
    timestamp: new Date(),
    services: {
      database: dbHealth ? 'healthy' : 'unhealthy',
      redis: redisHealth ? 'healthy' : 'unhealthy',
    },
    version: process.env['npm_package_version'] || '1.0.0',
  };

  return reply.status(statusCode).send(response);
});

// API routes placeholder
fastify.get('/api/v1/status', async (_request, reply) => {
  return reply.send({
    success: true,
    message: 'WebRTC Signaling Server API is running',
    version: '1.0.0',
    timestamp: new Date(),
  });
});

// 404 handler
fastify.setNotFoundHandler(async (_request, reply) => {
  return reply.status(HTTP_STATUS.NOT_FOUND).send({
    success: false,
    error: 'Route not found',
    code: 'NOT_FOUND',
    timestamp: new Date(),
  });
});

// Socket.IO setup
let io: SocketIOServer;

async function setupSocketIO(): Promise<void> {
  // Create Socket.IO server
  io = new SocketIOServer(fastify.server, {
    cors: {
      origin: config.cors.origin,
      credentials: config.cors.credentials,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 10000,
    maxHttpBufferSize: 1e6, // 1MB
    allowEIO3: false,
  });

  // Redis adapter for scaling (if Redis is available)
  try {
    const pubClient = redisClient.duplicate();
    const subClient = redisClient.duplicate();
    
    await Promise.all([
      pubClient.connect(),
      subClient.connect(),
    ]);

    io.adapter(createAdapter(pubClient, subClient));
    serverLogger.info('✅ Socket.IO Redis adapter configured');
  } catch (error) {
    serverLogger.warn('Redis adapter setup failed, using memory adapter:', error);
  }

  // Socket.IO middleware for rate limiting
  io.use(async (socket, next) => {
    const clientIP = socket.handshake.address;
    (socket as AuthenticatedSocket).rateLimitIdentifier = `socket:${clientIP}`;
    
    // Add basic properties
    (socket as AuthenticatedSocket).isAuthenticated = false;
    
    serverLogger.debug(`Socket connection attempt from ${clientIP}`, {
      socketId: socket.id,
      userAgent: socket.handshake.headers['user-agent'],
    });
    
    next();
  });

  // Connection event handler
  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    const authenticatedSocket = socket as AuthenticatedSocket;
    serverLogger.info(`Socket connected: ${authenticatedSocket.id}`);

    // Handle disconnection
    authenticatedSocket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      serverLogger.info(`Socket disconnected: ${authenticatedSocket.id}`, { reason });
      
      // Cleanup user session if authenticated
      if (authenticatedSocket.isAuthenticated && authenticatedSocket.user) {
        // TODO: Implement session cleanup
        serverLogger.debug(`Cleaning up session for user: ${authenticatedSocket.user.id}`);
      }
    });

    // Handle connection errors
    authenticatedSocket.on('error', (error) => {
      serverLogger.error(`Socket error for ${authenticatedSocket.id}:`, error);
    });

    // Placeholder for auth module registration
    // TODO: Register auth event handlers
    // Example: registerAuthHandlers(authenticatedSocket);

    // Placeholder for websocket module registration  
    // TODO: Register websocket event handlers
    // Example: registerWebSocketHandlers(authenticatedSocket);

    // Placeholder for signaling module registration
    // TODO: Register signaling event handlers
    // Example: registerSignalingHandlers(authenticatedSocket);

    // Send welcome message
    authenticatedSocket.emit('server:welcome', {
      message: 'Connected to WebRTC Signaling Server',
      socketId: authenticatedSocket.id,
      timestamp: new Date(),
    });
  });

  serverLogger.info('✅ Socket.IO server configured');
}

// Graceful shutdown handler
async function gracefulShutdown(signal: string): Promise<void> {
  serverLogger.info(`Received ${signal}, starting graceful shutdown...`);

  try {
    // Stop accepting new connections
    if (io) {
      io.close();
      serverLogger.info('Socket.IO server closed');
    }

    // Close Fastify server
    await fastify.close();
    serverLogger.info('Fastify server closed');

    // Close database connections
    const { closeDatabaseConnection } = await import('./shared/database');
    await closeDatabaseConnection();

    // Close Redis connections
    const { closeRedisConnection } = await import('./shared/redis');
    await closeRedisConnection();

    serverLogger.info('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    serverLogger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Startup function
async function startServer(): Promise<void> {
  try {
    serverLogger.info('🚀 Starting WebRTC Signaling Server...');

    // Connect to Redis
    await connectRedis();

    // Register Fastify plugins
    await registerPlugins();

    // Setup Socket.IO
    await setupSocketIO();

    // Start the server
    const address = await fastify.listen({
      port: config.server.port,
      host: config.server.host,
    });

    serverLogger.info(`✅ Server running at ${address}`);
    serverLogger.info(`Environment: ${config.env}`);
    serverLogger.info(`Log level: ${config.logging.level}`);

  } catch (error) {
    serverLogger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  serverLogger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  serverLogger.error('Unhandled Rejection', reason, { promise });
  process.exit(1);
});

// Start the server
if (require.main === module) {
  startServer();
}

// Export for testing
export { fastify, io };
