#!/bin/bash

# WebRTC Signaling Server - Server Bootstrap Setup
echo "🚀 Setting up server bootstrap and Docker configuration..."

# Ensure we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run from signaling-server directory."
    exit 1
fi

# Create main server file
echo "⚡ Creating main server file..."
cat > src/server.ts << 'EOF'
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
    errorResponseBuilder: (request, context) => ({
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
fastify.get('/health', async (request, reply) => {
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
    version: process.env.npm_package_version || '1.0.0',
  };

  return reply.status(statusCode).send(response);
});

// API routes placeholder
fastify.get('/api/v1/status', async (request, reply) => {
  return reply.send({
    success: true,
    message: 'WebRTC Signaling Server API is running',
    version: '1.0.0',
    timestamp: new Date(),
  });
});

// 404 handler
fastify.setNotFoundHandler(async (request, reply) => {
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
  io.use(async (socket: AuthenticatedSocket, next) => {
    const clientIP = socket.handshake.address;
    socket.rateLimitIdentifier = `socket:${clientIP}`;
    
    // Add basic properties
    socket.isAuthenticated = false;
    
    serverLogger.debug(`Socket connection attempt from ${clientIP}`, {
      socketId: socket.id,
      userAgent: socket.handshake.headers['user-agent'],
    });
    
    next();
  });

  // Connection event handler
  io.on(SOCKET_EVENTS.CONNECTION, (socket: AuthenticatedSocket) => {
    serverLogger.info(`Socket connected: ${socket.id}`);

    // Handle disconnection
    socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      serverLogger.info(`Socket disconnected: ${socket.id}`, { reason });
      
      // Cleanup user session if authenticated
      if (socket.isAuthenticated && socket.user) {
        // TODO: Implement session cleanup
        serverLogger.debug(`Cleaning up session for user: ${socket.user.id}`);
      }
    });

    // Handle connection errors
    socket.on('error', (error) => {
      serverLogger.error(`Socket error for ${socket.id}:`, error);
    });

    // Placeholder for auth module registration
    // TODO: Register auth event handlers
    // Example: registerAuthHandlers(socket);

    // Placeholder for websocket module registration  
    // TODO: Register websocket event handlers
    // Example: registerWebSocketHandlers(socket);

    // Placeholder for signaling module registration
    // TODO: Register signaling event handlers
    // Example: registerSignalingHandlers(socket);

    // Send welcome message
    socket.emit('server:welcome', {
      message: 'Connected to WebRTC Signaling Server',
      socketId: socket.id,
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
  serverLogger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
if (require.main === module) {
  startServer();
}

// Export for testing
export { fastify, io };
EOF

# Create Docker Compose configuration
echo "🐳 Creating Docker Compose configuration..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: webrtc_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: webrtc_signaling
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    networks:
      - webrtc_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d webrtc_signaling"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  # Redis Cache & Message Broker
  redis:
    image: redis:7-alpine
    container_name: webrtc_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
      - ./redis.conf:/usr/local/etc/redis/redis.conf:ro
    networks:
      - webrtc_network
    command: redis-server /usr/local/etc/redis/redis.conf
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  # WebRTC Signaling Server (Development)
  signaling-server:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: webrtc_signaling_server
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://postgres:password@postgres:5432/webrtc_signaling
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your-super-secret-jwt-key-change-this-in-production-dev
      JWT_REFRESH_SECRET: your-super-secret-refresh-key-change-this-in-production-dev
    volumes:
      - .:/app
      - /app/node_modules
      - ./logs:/app/logs
    networks:
      - webrtc_network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Redis Commander (Optional - Redis GUI)
  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: webrtc_redis_commander
    restart: unless-stopped
    ports:
      - "8081:8081"
    environment:
      REDIS_HOSTS: local:redis:6379
      HTTP_USER: admin
      HTTP_PASSWORD: admin
    networks:
      - webrtc_network
    depends_on:
      - redis
    profiles:
      - tools

  # pgAdmin (Optional - PostgreSQL GUI)
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: webrtc_pgadmin
    restart: unless-stopped
    ports:
      - "8080:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@webrtc.local
      PGADMIN_DEFAULT_PASSWORD: admin
      PGADMIN_DISABLE_POSTFIX: "true"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    networks:
      - webrtc_network
    depends_on:
      - postgres
    profiles:
      - tools

# Named volumes
volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  pgadmin_data:
    driver: local

# Networks
networks:
  webrtc_network:
    driver: bridge
EOF

# Create Development Dockerfile
echo "📦 Creating Development Dockerfile..."
cat > Dockerfile.dev << 'EOF'
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    curl \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY drizzle.config.ts ./

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start development server
CMD ["npm", "run", "dev"]
EOF

# Create Production Dockerfile
echo "🏗️ Creating Production Dockerfile..."
cat > Dockerfile << 'EOF'
# Multi-stage build for production
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY drizzle.config.ts ./

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle

# Create logs directory and set permissions
RUN mkdir -p logs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/server.js"]
EOF

# Create Redis configuration
echo "⚙️ Creating Redis configuration..."
cat > redis.conf << 'EOF'
# Redis configuration for WebRTC Signaling Server

# Network
bind 0.0.0.0
port 6379
tcp-backlog 511
timeout 0
tcp-keepalive 300

# General
daemonize no
supervised no
pidfile /var/run/redis_6379.pid
loglevel notice
logfile ""
databases 16

# Snapshotting
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /data

# Replication
replica-serve-stale-data yes
replica-read-only yes
repl-diskless-sync no
repl-diskless-sync-delay 5
repl-ping-replica-period 10
repl-timeout 60
repl-disable-tcp-nodelay no
repl-backlog-size 1mb
repl-backlog-ttl 3600

# Security
# requirepass your_redis_password_here

# Memory management
maxmemory-policy allkeys-lru
# maxmemory 256mb

# Lazy freeing
lazyfree-lazy-eviction no
lazyfree-lazy-expire no
lazyfree-lazy-server-del no
replica-lazy-flush no

# Append only file
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-load-truncated yes
aof-use-rdb-preamble yes

# Lua scripting
lua-time-limit 5000

# Slow log
slowlog-log-slower-than 10000
slowlog-max-len 128

# Event notification
notify-keyspace-events ""

# Advanced config
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
list-compress-depth 0
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
hll-sparse-max-bytes 3000
stream-node-max-bytes 4096
stream-node-max-entries 100
activerehashing yes
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit replica 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60
hz 10
dynamic-hz yes
aof-rewrite-incremental-fsync yes
rdb-save-incremental-fsync yes
EOF

# Create database initialization script
echo "🗄️ Creating database initialization script..."
mkdir -p init-scripts
cat > init-scripts/01-init.sql << 'EOF'
-- WebRTC Signaling Server Database Initialization

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
DO $ BEGIN
    CREATE TYPE connection_state AS ENUM ('connected', 'disconnected', 'reconnecting');
EXCEPTION
    WHEN duplicate_object THEN null;
END $;

DO $ BEGIN
    CREATE TYPE room_status AS ENUM ('active', 'inactive', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $;

-- Create database user for the application (if not exists)
DO $ BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'webrtc_user') THEN
        CREATE ROLE webrtc_user WITH LOGIN PASSWORD 'webrtc_password';
    END IF;
END $;

-- Grant permissions
GRANT CONNECT ON DATABASE webrtc_signaling TO webrtc_user;
GRANT USAGE ON SCHEMA public TO webrtc_user;
GRANT CREATE ON SCHEMA public TO webrtc_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO webrtc_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO webrtc_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO webrtc_user;

-- Grant permissions on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO webrtc_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO webrtc_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO webrtc_user;

-- Set timezone
SET timezone = 'UTC';

-- Log initialization
SELECT 'WebRTC Signaling Server database initialized successfully' AS message;
EOF

# Create Docker Compose override for development
echo "🔧 Creating Docker Compose development override..."
cat > docker-compose.override.yml << 'EOF'
# Development overrides for docker-compose.yml
version: '3.8'

services:
  signaling-server:
    volumes:
      - .:/app
      - /app/node_modules
      - ./logs:/app/logs
    environment:
      NODE_ENV: development
      LOG_LEVEL: debug
    command: npm run dev

  # Enable development tools by default
  redis-commander:
    profiles: []

  pgadmin:
    profiles: []
EOF

# Create setup automation script
echo "🤖 Creating setup automation script..."
cat > setup.sh << 'EOF'
#!/bin/bash

# WebRTC Signaling Server - Complete Setup Script
echo "🚀 WebRTC Signaling Server - Complete Setup"
echo "============================================"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists docker; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command_exists docker-compose; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file
if [ ! -f ".env" ]; then
    echo "🔧 Creating environment file..."
    cp .env.example .env
    echo "✅ Environment file created (.env)"
    echo "⚠️  Please edit .env file with your configuration"
else
    echo "✅ Environment file already exists"
fi

# Create logs directory
mkdir -p logs

# Start services
echo "🐳 Starting Docker services..."
docker-compose up -d postgres redis

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are healthy
echo "🔍 Checking service health..."
until docker-compose exec postgres pg_isready -U postgres -d webrtc_signaling; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done

until docker-compose exec redis redis-cli ping; do
    echo "Waiting for Redis..."
    sleep 2
done

echo "✅ Services are ready"

# Generate and run database migrations
echo "🗄️ Setting up database..."
npm run db:generate
npm run db:migrate

echo "✅ Database setup completed"

# Start the application
echo "🚀 Starting signaling server..."
npm run dev &
SERVER_PID=$!

# Wait a moment for server to start
sleep 5

# Test the server
echo "🧪 Testing server health..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Server is running and healthy!"
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "📊 Services:"
    echo "   • Signaling Server: http://localhost:3000"
    echo "   • Health Check: http://localhost:3000/health"
    echo "   • API Status: http://localhost:3000/api/v1/status"
    echo "   • PostgreSQL: localhost:5432"
    echo "   • Redis: localhost:6379"
    echo "   • pgAdmin: http://localhost:8080 (admin@webrtc.local / admin)"
    echo "   • Redis Commander: http://localhost:8081 (admin / admin)"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Edit .env file with your configuration"
    echo "   2. Implement auth module in src/auth/"
    echo "   3. Implement websocket module in src/websocket/"
    echo "   4. Implement signaling module in src/signaling/"
    echo ""
    echo "🛑 To stop: kill $SERVER_PID && docker-compose down"
else
    echo "❌ Server health check failed"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi
EOF

# Make setup script executable
chmod +x setup.sh

# Create Docker ignore file
echo "📄 Creating .dockerignore..."
cat > .dockerignore << 'EOF'
node_modules
npm-debug.log
.env
.env.*
.git
.gitignore
README.md
docker-compose*.yml
Dockerfile*
.dockerignore
logs/
*.log
.nyc_output
coverage/
.vscode/
.idea/
*.swp
*.swo
.DS_Store
Thumbs.db
EOF

echo "✅ Server bootstrap setup completed!"
echo "📋 Components created:"
echo "   ✓ Fastify server with security middleware"
echo "   ✓ Socket.IO integration with Redis adapter"
echo "   ✓ Docker Compose for PostgreSQL + Redis"
echo "   ✓ Development and production Dockerfiles"
echo "   ✓ Redis configuration"
echo "   ✓ Database initialization scripts"
echo "   ✓ Complete setup automation script"
echo ""
echo "🔧 Features configured:"
echo "   • Health check endpoints"
echo "   • Graceful shutdown handling"
echo "   • Rate limiting and CORS"
echo "   • Structured logging"
echo "   • Redis adapter for Socket.IO scaling"
echo ""
echo "🚀 Quick start:"
echo "   chmod +x setup.sh && ./setup.sh"
echo ""
echo "🐳 Manual Docker start:"
echo "   docker-compose up -d"
echo ""
echo "💡 Optional development tools:"
echo "   docker-compose --profile tools up -d"
    