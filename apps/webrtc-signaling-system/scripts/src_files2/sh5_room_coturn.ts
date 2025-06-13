// ========================================
// SH 5: ROOM MANAGEMENT & COTURN
// ========================================
// Dosyalar:
// - src/signaling/handlers/room.handler.ts
// - src/signaling/services/coturn.service.ts

// ==========================================
// src/signaling/handlers/room.handler.ts
// ==========================================
import type { Server as SocketIOServer } from 'socket.io';
import type { AuthenticatedSocket } from '../../websocket/types.js';
import type { User } from '../../shared/types/user.js';
import {
  RoomCreateRequest,
  RoomCreateResponse,
  RoomJoinRequest,
  RoomJoinResponse,
  RoomLeaveRequest,
  RoomLeaveResponse,
  ROOM_EVENTS,
  SIGNALING_ERRORS,
  isRoomCreateRequest,
  isRoomJoinRequest,
  isRoomLeaveRequest
} from '../types.js';
import {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoomUsers,
  getUserRoom
} from '../services/room.service.js';
import { generateICEServers } from '../services/coturn.service.js';
import { getUserSockets } from '../../websocket/services/presence.service.js';
import { logger } from '../../shared/utils/logger.js';

export function handleRoomEvents(io: SocketIOServer, socket: AuthenticatedSocket) {
  const user = socket.data.user as User;
  
  socket.on(ROOM_EVENTS.CREATE, async (data: RoomCreateRequest) => {
    await handleRoomCreate(io, socket, user, data);
  });
  
  socket.on(ROOM_EVENTS.JOIN, async (data: RoomJoinRequest) => {
    await handleRoomJoin(io, socket, user, data);
  });
  
  socket.on(ROOM_EVENTS.LEAVE, async (data: RoomLeaveRequest) => {
    await handleRoomLeave(io, socket, user, data);
  });
}

async function handleRoomCreate(
  io: SocketIOServer,
  socket: AuthenticatedSocket,
  user: User,
  data: RoomCreateRequest
) {
  try {
    if (!isRoomCreateRequest(data)) {
      socket.emit('error', {
        code: SIGNALING_ERRORS.ROOM_CREATE_FAILED,
        message: 'Invalid room creation data'
      });
      return;
    }
    
    // Check if user is already in a room
    const currentRoom = await getUserRoom(user.id);
    if (currentRoom) {
      // Leave current room first
      await leaveRoom(currentRoom, user.id);
      
      // Notify other users in the old room
      await notifyRoomUserLeft(io, currentRoom, user.id);
    }
    
    // Create the room
    const room = await createRoom(user.id, data.roomId);
    
    // Generate ICE servers for WebRTC connection
    const iceServers = generateICEServers();
    
    const response: RoomCreateResponse = {
      roomId: room.id,
      iceServers
    };
    
    // Join the socket to a room for easier broadcasting
    socket.join(room.id);
    
    socket.emit(ROOM_EVENTS.CREATE, response);
    
    logger.info('Room created and user joined', {
      roomId: room.id,
      userId: user.id,
      initiatorId: room.initiatorId
    });
    
  } catch (error) {
    logger.error('Failed to create room', {
      userId: user.id,
      roomId: data.roomId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    socket.emit('error', {
      code: SIGNALING_ERRORS.ROOM_CREATE_FAILED,
      message: 'Failed to create room'
    });
  }
}

async function handleRoomJoin(
  io: SocketIOServer,
  socket: AuthenticatedSocket,
  user: User,
  data: RoomJoinRequest
) {
  try {
    if (!isRoomJoinRequest(data)) {
      socket.emit('error', {
        code: SIGNALING_ERRORS.ROOM_JOIN_FAILED,
        message: 'Invalid room join data'
      });
      return;
    }
    
    const { roomId } = data;
    
    // Check if user is already in a room
    const currentRoom = await getUserRoom(user.id);
    if (currentRoom && currentRoom !== roomId) {
      // Leave current room first
      await leaveRoom(currentRoom, user.id);
      
      // Notify other users in the old room
      await notifyRoomUserLeft(io, currentRoom, user.id);
    }
    
    // Join the room
    const result = await joinRoom(roomId, user.id);
    
    if (!result.success) {
      socket.emit(ROOM_EVENTS.JOIN, {
        success: false
      } as RoomJoinResponse);
      return;
    }
    
    // Get room users
    const roomUsers = await getRoomUsers(roomId);
    
    // Generate ICE servers
    const iceServers = generateICEServers();
    
    // Join socket to room
    socket.join(roomId);
    
    const response: RoomJoinResponse = {
      success: true,
      users: roomUsers,
      room: result.room,
      iceServers
    };
    
    socket.emit(ROOM_EVENTS.JOIN, response);
    
    // Notify other users in the room about the new user
    socket.to(roomId).emit(ROOM_EVENTS.USER_JOINED, {
      userId: user.id,
      roomId,
      user
    });
    
    logger.info('User joined room', {
      roomId,
      userId: user.id,
      totalUsers: roomUsers.length
    });
    
  } catch (error) {
    logger.error('Failed to join room', {
      userId: user.id,
      roomId: data.roomId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    socket.emit('error', {
      code: SIGNALING_ERRORS.ROOM_JOIN_FAILED,
      message: 'Failed to join room'
    });
  }
}

async function handleRoomLeave(
  io: SocketIOServer,
  socket: AuthenticatedSocket,
  user: User,
  data: RoomLeaveRequest
) {
  try {
    if (!isRoomLeaveRequest(data)) {
      socket.emit('error', {
        code: 'INVALID_LEAVE_DATA',
        message: 'Invalid room leave data'
      });
      return;
    }
    
    const { roomId } = data;
    
    // Verify user is in the room
    const currentRoom = await getUserRoom(user.id);
    if (currentRoom !== roomId) {
      socket.emit(ROOM_EVENTS.LEAVE, {
        success: false
      } as RoomLeaveResponse);
      return;
    }
    
    // Leave the room
    await leaveRoom(roomId, user.id);
    
    // Leave socket room
    socket.leave(roomId);
    
    // Notify other users in the room
    await notifyRoomUserLeft(io, roomId, user.id);
    
    socket.emit(ROOM_EVENTS.LEAVE, {
      success: true
    } as RoomLeaveResponse);
    
    logger.info('User left room', {
      roomId,
      userId: user.id
    });
    
  } catch (error) {
    logger.error('Failed to leave room', {
      userId: user.id,
      roomId: data.roomId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    socket.emit('error', {
      code: 'ROOM_LEAVE_FAILED',
      message: 'Failed to leave room'
    });
  }
}

async function notifyRoomUserLeft(
  io: SocketIOServer,
  roomId: string,
  userId: string
) {
  try {
    // Broadcast to all sockets in the room
    io.to(roomId).emit(ROOM_EVENTS.USER_LEFT, {
      userId,
      roomId
    });
    
    // Also notify the user's other sockets if they have multiple connections
    const userSockets = await getUserSockets(userId);
    for (const socketId of userSockets) {
      io.to(socketId).emit(ROOM_EVENTS.USER_LEFT, {
        userId,
        roomId
      });
    }
    
    logger.info('Room user left notification sent', { roomId, userId });
  } catch (error) {
    logger.error('Failed to notify room user left', {
      roomId,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// ==========================================
// src/signaling/services/coturn.service.ts
// ==========================================
import crypto from 'crypto';
import { logger } from '../../shared/utils/logger.js';

// COTURN/TURN server configuration
const TURN_CONFIG = {
  // Default STUN servers (public Google STUN servers)
  stunServers: [
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302',
    'stun:stun2.l.google.com:19302'
  ],
  
  // TURN server configuration (update with your COTURN server details)
  turnServer: {
    urls: process.env.TURN_SERVER_URL || 'turn:your-turn-server.com:3478',
    secret: process.env.TURN_SECRET || 'your-turn-secret-key',
    ttl: 86400 // 24 hours in seconds
  }
} as const;

export function generateICEServers(): RTCIceServer[] {
  try {
    const iceServers: RTCIceServer[] = [];
    
    // Add STUN servers
    TURN_CONFIG.stunServers.forEach(url => {
      iceServers.push({ urls: url });
    });
    
    // Add TURN server with credentials if configured
    if (process.env.TURN_SERVER_URL && process.env.TURN_SECRET) {
      const turnCredentials = generateTURNCredentials('webrtc-user');
      
      iceServers.push({
        urls: TURN_CONFIG.turnServer.urls,
        username: turnCredentials.username,
        credential: turnCredentials.credential,
        credentialType: 'password'
      });
      
      // Add TURN server with TCP if available
      const turnTcpUrl = TURN_CONFIG.turnServer.urls.replace('turn:', 'turn:').concat('?transport=tcp');
      iceServers.push({
        urls: turnTcpUrl,
        username: turnCredentials.username,
        credential: turnCredentials.credential,
        credentialType: 'password'
      });
    }
    
    logger.debug('Generated ICE servers', { 
      serverCount: iceServers.length,
      hasSTUN: iceServers.some(s => s.urls.toString().startsWith('stun:')),
      hasTURN: iceServers.some(s => s.urls.toString().startsWith('turn:'))
    });
    
    return iceServers;
  } catch (error) {
    logger.error('Failed to generate ICE servers', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Return fallback STUN servers
    return TURN_CONFIG.stunServers.map(url => ({ urls: url }));
  }
}

export function generateTURNCredentials(userId: string): {username: string, credential: string} {
  try {
    const timestamp = Math.floor(Date.now() / 1000) + TURN_CONFIG.turnServer.ttl;
    const username = `${timestamp}:${userId}`;
    
    // Generate HMAC-SHA1 credential using the shared secret
    const credential = crypto
      .createHmac('sha1', TURN_CONFIG.turnServer.secret)
      .update(username)
      .digest('base64');
    
    logger.debug('Generated TURN credentials', { 
      username,
      userId,
      expiresAt: new Date(timestamp * 1000).toISOString()
    });
    
    return { username, credential };
  } catch (error) {
    logger.error('Failed to generate TURN credentials', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Return fallback credentials
    return { 
      username: `${Date.now()}:${userId}`, 
      credential: 'fallback-credential' 
    };
  }
}

export function validateTURNCredentials(username: string, credential: string): boolean {
  try {
    const [timestampStr, userId] = username.split(':');
    const timestamp = parseInt(timestampStr, 10);
    
    // Check if credentials are expired
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (timestamp < currentTimestamp) {
      logger.warn('TURN credentials expired', { username, timestamp, currentTimestamp });
      return false;
    }
    
    // Verify credential
    const expectedCredential = crypto
      .createHmac('sha1', TURN_CONFIG.turnServer.secret)
      .update(username)
      .digest('base64');
    
    const isValid = credential === expectedCredential;
    
    if (!isValid) {
      logger.warn('Invalid TURN credentials', { username });
    }
    
    return isValid;
  } catch (error) {
    logger.error('Failed to validate TURN credentials', {
      username,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

export function getTURNServerConfig() {
  return {
    url: TURN_CONFIG.turnServer.urls,
    hasSecret: Boolean(TURN_CONFIG.turnServer.secret),
    ttl: TURN_CONFIG.turnServer.ttl,
    stunServers: TURN_CONFIG.stunServers
  };
}

// Utility function to test TURN server connectivity
export async function testTURNServerConnectivity(): Promise<boolean> {
  try {
    // This is a basic test - in a real implementation, you might want to
    // use a more sophisticated connectivity test
    const iceServers = generateICEServers();
    const hasTURNServer = iceServers.some(server => 
      server.urls.toString().startsWith('turn:')
    );
    
    logger.info('TURN server connectivity test', { 
      hasTURNServer,
      totalServers: iceServers.length 
    });
    
    return hasTURNServer;
  } catch (error) {
    logger.error('TURN server connectivity test failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}