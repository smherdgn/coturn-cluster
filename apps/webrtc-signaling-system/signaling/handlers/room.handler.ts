// ========================================
// SH 5: ROOM MANAGEMENT & COTURN
// ========================================
// Dosyalar:
// - src/signaling/handlers/room.handler.ts
// - src/signaling/services/coturn.service.ts

// ==========================================
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
