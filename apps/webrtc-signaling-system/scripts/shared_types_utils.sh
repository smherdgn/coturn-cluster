#!/bin/bash

# WebRTC Signaling Server - Shared Types & Utils Setup
echo "📝 Setting up shared types and utilities..."

# Ensure we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run from signaling-server directory."
    exit 1
fi

# Create user types
echo "👤 Creating user types..."
cat > src/shared/types/user.ts << 'EOF'
import { User, UserSession } from '../database/schema';

// User profile interface
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatar?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  lastActiveAt?: Date;
  createdAt: Date;
}

// User session interface
export interface UserSessionData {
  id: string;
  userId: string;
  roomId?: string;
  socketId?: string;
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
    browser?: string;
    os?: string;
    ip?: string;
  };
  connectionState: 'connected' | 'disconnected' | 'reconnecting';
  permissions: UserPermissions;
  joinedAt?: Date;
  leftAt?: Date;
  lastPingAt?: Date;
}

// User permissions interface
export interface UserPermissions {
  canSpeak?: boolean;
  canVideo?: boolean;
  canScreenShare?: boolean;
  canChat?: boolean;
  isModerator?: boolean;
}

// Authentication interfaces
export interface LoginRequest {
  email: string;
  password: string;
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
    ip?: string;
  };
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  displayName?: string;
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
    ip?: string;
  };
}

export interface AuthResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ProfileUpdateRequest {
  username?: string;
  displayName?: string;
  avatar?: string;
}

// User status
export type UserStatus = 'online' | 'away' | 'busy' | 'offline';

// Connected user info
export interface ConnectedUser {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  status: UserStatus;
  permissions: UserPermissions;
  joinedAt: Date;
  lastActiveAt: Date;
}

// User connection event
export interface UserConnectionEvent {
  type: 'user_joined' | 'user_left' | 'user_updated';
  user: ConnectedUser;
  roomId?: string;
  timestamp: Date;
}

// Export database types
export type { User, UserSession };
EOF

# Create room types
echo "🏠 Creating room types..."
cat > src/shared/types/room.ts << 'EOF'
import { Room } from '../database/schema';
import { ConnectedUser, UserPermissions } from './user';

// Room configuration interface
export interface RoomSettings {
  audioEnabled?: boolean;
  videoEnabled?: boolean;
  screenShareEnabled?: boolean;
  chatEnabled?: boolean;
  moderationEnabled?: boolean;
  maxParticipants?: number;
  isPrivate?: boolean;
  requirePassword?: boolean;
}

// Room state interface
export interface RoomState {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  settings: RoomSettings;
  status: 'active' | 'inactive' | 'closed';
  participantCount: number;
  participants: ConnectedUser[];
  createdAt: Date;
  updatedAt: Date;
}

// Room creation request
export interface CreateRoomRequest {
  name: string;
  description?: string;
  settings?: RoomSettings;
  password?: string;
}

// Room update request
export interface UpdateRoomRequest {
  name?: string;
  description?: string;
  settings?: Partial<RoomSettings>;
  password?: string;
}

// Room join request
export interface JoinRoomRequest {
  roomId: string;
  password?: string;
  userPermissions?: Partial<UserPermissions>;
}

// Room join response
export interface JoinRoomResponse {
  room: RoomState;
  userPermissions: UserPermissions;
  participants: ConnectedUser[];
}

// Room list item
export interface RoomListItem {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  participantCount: number;
  maxParticipants: number;
  isPrivate: boolean;
  requirePassword: boolean;
  status: 'active' | 'inactive' | 'closed';
  createdAt: Date;
}

// Room list response
export interface RoomListResponse {
  rooms: RoomListItem[];
  total: number;
  page: number;
  limit: number;
}

// Room event interface
export interface RoomEvent {
  type: 'room_created' | 'room_updated' | 'room_deleted' | 'room_joined' | 'room_left';
  roomId: string;
  userId?: string;
  data?: any;
  timestamp: Date;
}

// Room participant event
export interface RoomParticipantEvent {
  type: 'participant_joined' | 'participant_left' | 'participant_updated';
  roomId: string;
  participant: ConnectedUser;
  timestamp: Date;
}

// Room message
export interface RoomMessage {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  displayName?: string;
  message: string;
  timestamp: Date;
  messageType: 'text' | 'system' | 'media';
}

// Room statistics
export interface RoomStatistics {
  totalRooms: number;
  activeRooms: number;
  totalParticipants: number;
  averageParticipantsPerRoom: number;
  peakConcurrentUsers: number;
  lastUpdated: Date;
}

// Export database types
export type { Room };
EOF

# Create socket types
echo "🔌 Creating socket types..."
cat > src/shared/types/socket.ts << 'EOF'
import { Socket } from 'socket.io';
import { UserProfile, UserPermissions } from './user';
import { RoomState } from './room';

// Authenticated socket user
export interface SocketUser {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatar?: string;
  permissions: UserPermissions;
  roomId?: string;
  status: 'online' | 'away' | 'busy';
  connectedAt: Date;
  lastActiveAt: Date;
}

// Extended socket with user data
export interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
  isAuthenticated: boolean;
  rateLimitIdentifier: string;
}

// Socket event handlers type
export type SocketEventHandler<T = any> = (data: T, callback?: (response: any) => void) => void | Promise<void>;

// WebRTC signaling interfaces
export interface WebRTCOffer {
  roomId: string;
  targetUserId: string;
  offer: RTCSessionDescriptionInit;
  metadata?: {
    audio: boolean;
    video: boolean;
    screenShare: boolean;
  };
}

export interface WebRTCAnswer {
  roomId: string;
  targetUserId: string;
  answer: RTCSessionDescriptionInit;
}

export interface WebRTCIceCandidate {
  roomId: string;
  targetUserId: string;
  candidate: RTCIceCandidateInit;
}

// Media state change
export interface MediaStateChange {
  roomId: string;
  userId: string;
  mediaType: 'audio' | 'video' | 'screenShare';
  enabled: boolean;
  timestamp: Date;
}

// Chat message
export interface ChatMessage {
  roomId: string;
  message: string;
  messageType?: 'text' | 'system';
  metadata?: {
    mentions?: string[];
    attachments?: string[];
  };
}

// Typing indicator
export interface TypingIndicator {
  roomId: string;
  isTyping: boolean;
}

// Socket authentication request
export interface SocketAuthRequest {
  token: string;
  roomId?: string;
}

// Socket authentication response
export interface SocketAuthResponse {
  success: boolean;
  user?: UserProfile;
  error?: string;
  permissions?: UserPermissions;
}

// Socket error response
export interface SocketErrorResponse {
  error: string;
  code: string;
  details?: any;
  timestamp: Date;
}

// Socket validation error
export interface SocketValidationError {
  field: string;
  message: string;
  value?: any;
}

// Room update notification
export interface RoomUpdateNotification {
  roomId: string;
  updateType: 'settings' | 'participants' | 'status';
  data: any;
  timestamp: Date;
}

// Peer connection state
export interface PeerConnectionState {
  userId: string;
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
  iceGatheringState: RTCIceGatheringState;
  signallingState: RTCSignalingState;
  timestamp: Date;
}

// Connection quality metrics
export interface ConnectionQuality {
  userId: string;
  roomId: string;
  metrics: {
    rtt: number; // Round trip time
    packetLoss: number;
    jitter: number;
    bandwidth: {
      upload: number;
      download: number;
    };
    audio?: {
      bitrate: number;
      packetsLost: number;
      packetsReceived: number;
    };
    video?: {
      bitrate: number;
      packetsLost: number;
      packetsReceived: number;
      frameRate: number;
      resolution: {
        width: number;
        height: number;
      };
    };
  };
  timestamp: Date;
}

// Socket middleware context
export interface SocketMiddlewareContext {
  socket: AuthenticatedSocket;
  data: any;
  next: (error?: Error) => void;
}

// Rate limit info
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
  blocked: boolean;
}
EOF

# Create logger utility
echo "📊 Creating logger utility..."
cat > src/shared/utils/logger.ts << 'EOF'
import winston from 'winston';
import { config } from '../config';

// Custom log levels
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
  },
};

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logMessage = `${timestamp} [${level}]: ${message}`;
    
    // Add stack trace for errors
    if (stack) {
      logMessage += `\n${stack}`;
    }
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return logMessage;
  })
);

// File log format (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    level: config.logging.level,
    format: logFormat,
  }),
];

// Add file transport if not in test environment
if (config.env !== 'test') {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
      filename: config.logging.file,
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  levels: customLevels.levels,
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true })
  ),
  transports,
  exitOnError: false,
});

// Add colors to winston
winston.addColors(customLevels.colors);

// Enhanced logging methods
export class Logger {
  private context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  private formatMessage(message: string): string {
    return this.context ? `[${this.context}] ${message}` : message;
  }

  error(message: string, error?: Error | any, meta?: any): void {
    const logMeta = { ...meta };
    if (error) {
      if (error instanceof Error) {
        logMeta.error = {
          message: error.message,
          stack: error.stack,
          name: error.name,
        };
      } else {
        logMeta.error = error;
      }
    }
    logger.error(this.formatMessage(message), logMeta);
  }

  warn(message: string, meta?: any): void {
    logger.warn(this.formatMessage(message), meta);
  }

  info(message: string, meta?: any): void {
    logger.info(this.formatMessage(message), meta);
  }

  debug(message: string, meta?: any): void {
    logger.debug(this.formatMessage(message), meta);
  }

  // HTTP request logging
  http(method: string, url: string, statusCode: number, responseTime: number, meta?: any): void {
    const logLevel = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';
    const message = `${method} ${url} ${statusCode} - ${responseTime}ms`;
    
    logger.log(logLevel, this.formatMessage(message), {
      method,
      url,
      statusCode,
      responseTime,
      ...meta,
    });
  }

  // Database operation logging
  db(operation: string, table: string, duration: number, meta?: any): void {
    this.debug(`DB ${operation} on ${table} completed in ${duration}ms`, {
      operation,
      table,
      duration,
      ...meta,
    });
  }

  // WebSocket event logging
  socket(event: string, socketId: string, userId?: string, meta?: any): void {
    this.debug(`Socket event: ${event}`, {
      event,
      socketId,
      userId,
      ...meta,
    });
  }

  // Authentication logging
  auth(action: string, userId?: string, success = true, meta?: any): void {
    const level = success ? 'info' : 'warn';
    const message = `Auth ${action} ${success ? 'succeeded' : 'failed'}`;
    
    logger.log(level, this.formatMessage(message), {
      action,
      userId,
      success,
      ...meta,
    });
  }

  // Performance logging
  performance(operation: string, duration: number, meta?: any): void {
    const level = duration > 1000 ? 'warn' : 'debug';
    this.log(level, `Performance: ${operation} took ${duration}ms`, {
      operation,
      duration,
      ...meta,
    });
  }

  private log(level: string, message: string, meta?: any): void {
    logger.log(level, this.formatMessage(message), meta);
  }
}

// Create default logger instance
export const defaultLogger = new Logger();

// Export convenience methods
export const logError = (message: string, error?: Error | any, meta?: any) => 
  defaultLogger.error(message, error, meta);

export const logWarn = (message: string, meta?: any) => 
  defaultLogger.warn(message, meta);

export const logInfo = (message: string, meta?: any) => 
  defaultLogger.info(message, meta);

export const logDebug = (message: string, meta?: any) => 
  defaultLogger.debug(message, meta);

// Request logging middleware helper
export const createRequestLogger = (context: string) => new Logger(context);

// Stream for Morgan HTTP logging
export const httpLogStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Handle uncaught exceptions and unhandled rejections
if (config.env === 'production') {
  logger.exceptions.handle(
    new winston.transports.File({ 
      filename: 'logs/exceptions.log',
      format: fileFormat,
    })
  );

  logger.rejections.handle(
    new winston.transports.File({ 
      filename: 'logs/rejections.log',
      format: fileFormat,
    })
  );
}

// Log startup information
if (config.env !== 'test') {
  logger.info('Logger initialized', {
    level: config.logging.level,
    environment: config.env,
    logFile: config.logging.file,
  });
}
EOF

# Create helper utilities
echo "🛠️ Creating helper utilities..."
cat > src/shared/utils/helpers.ts << 'EOF'
import { randomBytes, createHash } from 'crypto';
import { z } from 'zod';

// Generate random string
export function generateRandomString(length = 32): string {
  return randomBytes(length).toString('hex');
}

// Generate UUID v4
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Hash password or data
export function createSHA256Hash(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

// Sleep utility
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry utility
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      await sleep(delay * attempt);
    }
  }

  throw lastError!;
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastExecution = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastExecution >= delay) {
      func(...args);
      lastExecution = now;
    }
  };
}

// Deep clone utility
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  
  return obj;
}

// Object pick utility
export function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

// Object omit utility
export function omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailSchema = z.string().email();
  return emailSchema.safeParse(email).success;
}

// Validate password strength
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long');
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    feedback.push('Password must contain lowercase letters');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('Password must contain uppercase letters');
  } else {
    score += 1;
  }

  if (!/\d/.test(password)) {
    feedback.push('Password must contain numbers');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    feedback.push('Password must contain special characters');
  } else {
    score += 1;
  }

  return {
    isValid: score >= 4,
    score,
    feedback,
  };
}

// Format file size
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}

// Format duration
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

// Sanitize filename
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9\-_.]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Check if object is empty
export function isEmpty(obj: any): boolean {
  if (obj === null || obj === undefined) return true;
  if (typeof obj === 'string' || Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
}

// Safe JSON parse
export function safeJsonParse<T = any>(str: string, defaultValue: T): T {
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
}

// Get client IP from request headers
export function getClientIP(headers: Record<string, string | string[] | undefined>): string {
  const forwardedFor = headers['x-forwarded-for'];
  const realIP = headers['x-real-ip'];
  const clientIP = headers['x-client-ip'];

  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ips.split(',')[0].trim();
  }

  if (realIP) {
    return Array.isArray(realIP) ? realIP[0] : realIP;
  }

  if (clientIP) {
    return Array.isArray(clientIP) ? clientIP[0] : clientIP;
  }

  return 'unknown';
}

// Mask sensitive data
export function maskSensitiveData(data: string, visibleChars = 4): string {
  if (data.length <= visibleChars) {
    return '*'.repeat(data.length);
  }
  
  const visible = data.slice(-visibleChars);
  const masked = '*'.repeat(data.length - visibleChars);
  return masked + visible;
}

// Convert milliseconds to human readable time
export function msToTime(ms: number): string {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

// Array chunk utility
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Array unique by property
export function uniqueBy<T, K extends keyof T>(array: T[], key: K): T[] {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}
EOF

# Create shared types index
echo "📦 Creating shared types index..."
cat > src/shared/types/index.ts << 'EOF'
// Type exports
export * from './user';
export * from './room';
export * from './socket';

// Common response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: any;
  timestamp: Date;
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  uptime: number;
  timestamp: Date;
  services: {
    database: 'healthy' | 'unhealthy';
    redis: 'healthy' | 'unhealthy';
  };
  version: string;
}
EOF

# Create utils index
echo "📦 Creating utils index..."
cat > src/shared/utils/index.ts << 'EOF'
// Utility exports
export { logger, Logger, defaultLogger, logError, logWarn, logInfo, logDebug, createRequestLogger, httpLogStream } from './logger';
export * from './helpers';
EOF

# Create shared module index
echo "📦 Creating shared module index..."
cat > src/shared/index.ts << 'EOF'
// Shared module exports
export * from './types';
export * from './config';
export * from './database';
export * from './redis';
export * from './utils';
EOF

echo "✅ Shared types and utilities setup completed!"
echo "📋 Components created:"
echo "   ✓ User types (profiles, sessions, auth)"
echo "   ✓ Room types (state, settings, events)"
echo "   ✓ Socket types (WebRTC, events, auth)"
echo "   ✓ Winston logger with context support"
echo "   ✓ Helper utilities (crypto, validation, formatting)"
echo "   ✓ Common API response types"
echo ""
echo "🔧 Features available:"
echo "   • Type-safe interfaces for all entities"
echo "   • Structured logging with multiple transports"
echo "   • Utility functions for common operations"
echo "   • WebRTC signaling type definitions"
echo ""
echo "📝 Next: Run ./05-server-bootstrap.sh"