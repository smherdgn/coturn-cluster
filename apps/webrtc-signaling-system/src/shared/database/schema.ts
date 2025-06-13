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
