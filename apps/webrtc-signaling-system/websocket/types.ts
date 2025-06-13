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
