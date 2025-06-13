// ========================================
// SH 1: WEBSOCKET MODULE SETUP
// ========================================
// Dosyalar:
// - src/websocket/index.ts
// - src/websocket/middleware/socket-auth.ts
// - src/websocket/types.ts

// ==========================================
// src/websocket/index.ts
// ==========================================
import type { Server as SocketIOServer } from 'socket.io';
import { socketAuthMiddleware } from './middleware/socket-auth.js';
import { handleConnection } from './handlers/connection.handler.js';

export default async function setupWebSocket(io: SocketIOServer) {
  io.use(socketAuthMiddleware);
  io.on('connection', (socket) => handleConnection(io, socket));
}

// ==========================================
// src/websocket/middleware/socket-auth.ts
// ==========================================
import type { Socket } from 'socket.io';
import { validateToken } from '../../auth/services/auth.service.js';
import { logger } from '../../shared/utils/logger.js';

export async function socketAuthMiddleware(socket: Socket, next: Function) {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      logger.warn('Socket connection attempt without token', { 
        socketId: socket.id,
        ip: socket.handshake.address 
      });
      return next(new Error('Authentication token required'));
    }

    // validateToken from auth service
    const user = await validateToken(token);
    
    if (!user) {
      logger.warn('Socket connection with invalid token', { 
        socketId: socket.id,
        token: token.substring(0, 20) + '...' 
      });
      return next(new Error('Invalid authentication token'));
    }

    // Inject user data into socket
    socket.data.user = user;
    
    logger.info('Socket authenticated successfully', { 
      socketId: socket.id,
      userId: user.id,
      email: user.email 
    });
    
    next();
  } catch (error) {
    logger.error('Socket authentication error', { 
      socketId: socket.id,
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    next(new Error('Authentication failed'));
  }
}

// ==========================================
// src/websocket/types.ts
// ==========================================
import type { Socket } from 'socket.io';
import type { User } from '../shared/types/user.js';

export interface AuthenticatedSocket extends Socket {
  data: {
    user: User;
  };
}

export interface SocketConnectionData {
  socketId: string;
  userId: string;
  connectedAt: Date;
  lastActivity: Date;
}

export interface UserPresenceStatus {
  userId: string;
  status: 'online' | 'offline' | 'away';
  socketIds: string[];
  lastSeen: Date;
}

export interface SocketEventData {
  timestamp: Date;
  eventType: string;
  userId?: string;
  socketId: string;
  data?: any;
}

// WebSocket Error Types
export interface SocketError {
  code: string;
  message: string;
  details?: any;
}

export const SOCKET_ERRORS = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  RATE_LIMITED: 'RATE_LIMITED'
} as const;

// Socket Event Names
export const SOCKET_EVENTS = {
  // Connection Events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // Presence Events
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  USER_AWAY: 'user:away',
  
  // Room Events
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_USER_LEFT: 'room:user-left',
  ROOM_USER_JOINED: 'room:user-joined',
  
  // WebRTC Events
  WEBRTC_OFFER: 'webrtc:offer',
  WEBRTC_ANSWER: 'webrtc:answer',
  WEBRTC_CANDIDATE: 'webrtc:candidate',
  WEBRTC_CONNECTION_STATE: 'webrtc:connection-state'
} as const;

export type SocketEventType = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];