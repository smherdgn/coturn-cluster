#!/bin/bash

# WebRTC Signaling Server - Database Layer Setup
echo "🗄️ Setting up Database Layer with Drizzle ORM..."

# Ensure we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run from signaling-server directory."
    exit 1
fi

# Create database schema
echo "📋 Creating database schema..."
cat > src/shared/database/schema.ts << 'EOF'
import { pgTable, varchar, timestamp, boolean, text, integer, jsonb, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  username: varchar('username', { length: 50 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 100 }),
  avatar: text('avatar'),
  isEmailVerified: boolean('is_email_verified').default(false),
  isActive: boolean('is_active').default(true),
  lastActiveAt: timestamp('last_active_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
  usernameIdx: uniqueIndex('users_username_idx').on(table.username),
  lastActiveIdx: index('users_last_active_idx').on(table.lastActiveAt),
}));

// Rooms table
export const rooms = pgTable('rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  maxParticipants: integer('max_participants').default(8),
  isPrivate: boolean('is_private').default(false),
  password: varchar('password', { length: 255 }),
  settings: jsonb('settings').$type<{
    audioEnabled?: boolean;
    videoEnabled?: boolean;
    screenShareEnabled?: boolean;
    chatEnabled?: boolean;
    moderationEnabled?: boolean;
  }>().default({}),
  status: varchar('status', { length: 20 }).notNull().default('active'), // active, inactive, closed
  participantCount: integer('participant_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  closedAt: timestamp('closed_at'),
}, (table) => ({
  ownerIdx: index('rooms_owner_idx').on(table.ownerId),
  statusIdx: index('rooms_status_idx').on(table.status),
  createdAtIdx: index('rooms_created_at_idx').on(table.createdAt),
}));

// User sessions table
export const userSessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'cascade' }),
  socketId: varchar('socket_id', { length: 100 }),
  deviceInfo: jsonb('device_info').$type<{
    userAgent?: string;
    platform?: string;
    browser?: string;
    os?: string;
    ip?: string;
  }>(),
  connectionState: varchar('connection_state', { length: 20 }).default('disconnected'), // connected, disconnected, reconnecting
  permissions: jsonb('permissions').$type<{
    canSpeak?: boolean;
    canVideo?: boolean;
    canScreenShare?: boolean;
    canChat?: boolean;
    isModerator?: boolean;
  }>().default({}),
  joinedAt: timestamp('joined_at').defaultNow(),
  leftAt: timestamp('left_at'),
  lastPingAt: timestamp('last_ping_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('user_sessions_user_idx').on(table.userId),
  roomIdx: index('user_sessions_room_idx').on(table.roomId),
  socketIdx: index('user_sessions_socket_idx').on(table.socketId),
  connectionStateIdx: index('user_sessions_connection_state_idx').on(table.connectionState),
  activeSessionIdx: index('user_sessions_active_idx').on(table.userId, table.roomId, table.connectionState),
}));

// Refresh tokens table
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  token: varchar('token', { length: 500 }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  deviceInfo: jsonb('device_info').$type<{
    userAgent?: string;
    ip?: string;
    platform?: string;
  }>(),
  isRevoked: boolean('is_revoked').default(false),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  revokedAt: timestamp('revoked_at'),
}, (table) => ({
  tokenIdx: uniqueIndex('refresh_tokens_token_idx').on(table.token),
  userIdx: index('refresh_tokens_user_idx').on(table.userId),
  expiresIdx: index('refresh_tokens_expires_idx').on(table.expiresAt),
  activeTokenIdx: index('refresh_tokens_active_idx').on(table.userId, table.isRevoked),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ownedRooms: many(rooms),
  sessions: many(userSessions),
  refreshTokens: many(refreshTokens),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  owner: one(users, {
    fields: [rooms.ownerId],
    references: [users.id],
  }),
  sessions: many(userSessions),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
  room: one(rooms, {
    fields: [userSessions.roomId],
    references: [rooms.id],
  }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
EOF

# Create database connection
echo "🔗 Creating database connection..."
cat > src/shared/database/connection.ts << 'EOF'
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { config } from '../config';
import { logger } from '../utils/logger';

// Create postgres client
const client = postgres(config.database.url, {
  max: config.database.maxConnections,
  idle_timeout: config.database.idleTimeout,
  connect_timeout: config.database.connectTimeout,
  prepare: false,
  onnotice: (notice) => {
    if (config.env === 'development') {
      logger.debug('PostgreSQL notice:', notice);
    }
  },
  debug: config.env === 'development' ? (connection, query, parameters) => {
    logger.debug('PostgreSQL query:', { connection, query, parameters });
  } : false,
});

// Create drizzle instance
export const db = drizzle(client, { 
  schema,
  logger: config.env === 'development'
});

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    logger.info('Database connection is healthy');
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await client.end();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
}

// Connection event handlers
process.on('SIGINT', closeDatabaseConnection);
process.on('SIGTERM', closeDatabaseConnection);
process.on('beforeExit', closeDatabaseConnection);
EOF

# Create migration runner
echo "🚀 Creating migration runner..."
cat > src/shared/database/migrate.ts << 'EOF'
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { config } from '../config';
import { logger } from '../utils/logger';

async function runMigrations(): Promise<void> {
  logger.info('Starting database migrations...');
  
  try {
    // Create migration client
    const migrationClient = postgres(config.database.url, {
      max: 1,
      prepare: false,
    });

    const db = drizzle(migrationClient, { logger: true });

    // Run migrations
    await migrate(db, { 
      migrationsFolder: './drizzle',
      migrationsTable: 'drizzle_migrations',
    });

    logger.info('✅ Migrations completed successfully');
    
    // Close connection
    await migrationClient.end();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

export { runMigrations };
EOF

# Create drizzle config
echo "⚙️ Creating Drizzle configuration..."
cat > drizzle.config.ts << 'EOF'
import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

export default {
  schema: './src/shared/database/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
  // Generate migrations with timestamps
  migrations: {
    prefix: 'timestamp',
  },
} satisfies Config;
EOF

# Create database module index
echo "📦 Creating database module index..."
cat > src/shared/database/index.ts << 'EOF'
// Database exports
export { db, checkDatabaseHealth, closeDatabaseConnection } from './connection';
export { runMigrations } from './migrate';
export * from './schema';
EOF

echo "✅ Database layer setup completed!"
echo "📋 Database components created:"
echo "   ✓ PostgreSQL schema with relations"
echo "   ✓ Database connection with health checks"
echo "   ✓ Migration runner"
echo "   ✓ Drizzle configuration"
echo ""
echo "🔧 Tables created:"
echo "   • users (authentication & profiles)"
echo "   • rooms (WebRTC rooms)"
echo "   • user_sessions (active connections)"
echo "   • refresh_tokens (JWT refresh tokens)"
echo ""
echo "📝 Next: Run ./03-redis-config.sh"