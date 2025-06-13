// ========================================
// SH 4: ROOM & WEBRTC HANDLERS
// ========================================
// Dosyalar:
// - src/signaling/services/room.service.ts
// - src/signaling/handlers/webrtc.handler.ts

// ==========================================
// src/signaling/services/room.service.ts
// ==========================================
import { eq, and } from 'drizzle-orm';
import { db } from '../../shared/database/connection.js';
import { rooms } from '../../shared/database/schema.js';
import { redisClient } from '../../shared/redis/connection.js';
import { logger } from '../../shared/utils/logger.js';
import type { Room } from '../../shared/types/room.js';
import type { User } from '../../shared/types/user.js';
import { nanoid } from 'nanoid';

const REDIS_KEYS = {
  ROOM_USERS: (roomId: string) => `room:${roomId}:users`,
  USER_ROOM: (userId: string) => `user:${userId}:room`,
  ROOM_STATE: (roomId: string) => `room:${roomId}:state`,
  ROOM_PEERS: (roomId: string) => `room:${roomId}:peers`
} as const;

export async function createRoom(initiatorId: string, roomId?: string): Promise<Room> {
  try {
    const newRoomId = roomId || nanoid(8);
    
    // Check if custom roomId already exists
    if (roomId) {
      const existingRoom = await db
        .select()
        .from(rooms)
        .where(eq(rooms.id, roomId))
        .limit(1);
      
      if (existingRoom.length > 0) {
        throw new Error(`Room with ID ${roomId} already exists`);
      }
    }
    
    // Create room in database
    const [room] = await db
      .insert(rooms)
      .values({
        id: newRoomId,
        initiatorId,
        status: 'waiting',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    // Initialize room in Redis
    const multi = redisClient.multi();
    
    // Add initiator to room users
    multi.sadd(REDIS_KEYS.ROOM_USERS(newRoomId), initiatorId);
    
    // Set user's current room
    multi.set(REDIS_KEYS.USER_ROOM(initiatorId), newRoomId);
    
    // Set room state
    multi.hset(REDIS_KEYS.ROOM_STATE(newRoomId), {
      status: 'waiting',
      initiatorId,
      createdAt: new Date().toISOString(),
      participantCount: 1
    });
    
    // Set TTL for room data (24 hours)
    multi.expire(REDIS_KEYS.ROOM_USERS(newRoomId), 86400);
    multi.expire(REDIS_KEYS.ROOM_STATE(newRoomId), 86400);
    
    await multi.exec();
    
    logger.info('User left room successfully', { roomId, userId, remainingUsers: remainingUsers.length });
  } catch (error) {
    logger.error('Failed to leave room', { 
      roomId, 
      userId,
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
}

export async function getRoomUsers(roomId: string): Promise<User[]> {
  try {
    // Get user IDs from Redis
    const userIds = await redisClient.smembers(REDIS_KEYS.ROOM_USERS(roomId));
    
    if (userIds.length === 0) {
      return [];
    }
    
    // Get user details from database
    // Note: This assumes there's a users table - adjust query based on your schema
    const users = await db.query.users?.findMany({
      where: (users, { inArray }) => inArray(users.id, userIds)
    }) || [];
    
    return users as User[];
  } catch (error) {
    logger.error('Failed to get room users', { 
      roomId,
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return [];
  }
}

export async function isRoomFull(roomId: string): Promise<boolean> {
  try {
    const participantCount = await redisClient.scard(REDIS_KEYS.ROOM_USERS(roomId));
    return participantCount >= 2; // Assuming max 2 participants for peer-to-peer
  } catch (error) {
    logger.error('Failed to check if room is full', { 
      roomId,
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return true; // Fail safe - assume room is full
  }
}

export async function getRoomState(roomId: string): Promise<any> {
  try {
    const state = await redisClient.hgetall(REDIS_KEYS.ROOM_STATE(roomId));
    return state;
  } catch (error) {
    logger.error('Failed to get room state', { 
      roomId,
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return null;
  }
}

export async function getUserRoom(userId: string): Promise<string | null> {
  try {
    const roomId = await redisClient.get(REDIS_KEYS.USER_ROOM(userId));
    return roomId;
  } catch (error) {
    logger.error('Failed to get user room', { 
      userId,
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return null;
  }
}

// ==========================================
// src/signaling/handlers/webrtc.handler.ts
// ==========================================
import type { Server as SocketIOServer } from 'socket.io';
import type { AuthenticatedSocket } from '../../websocket/types.js';
import type { User } from '../../shared/types/user.js';
import { 
  WebRTCOffer, 
  WebRTCAnswer, 
  WebRTCCandidate,
  WEBRTC_EVENTS,
  SIGNALING_ERRORS,
  isWebRTCOffer,
  isWebRTCAnswer,
  isWebRTCCandidate
} from '../types.js';
import { getUserSockets } from '../../websocket/services/presence.service.js';
import { getRoomUsers, getUserRoom } from '../services/room.service.js';
import { logger } from '../../shared/utils/logger.js';

export function handleWebRTCEvents(io: SocketIOServer, socket: AuthenticatedSocket) {
  const user = socket.data.user as User;
  
  socket.on(WEBRTC_EVENTS.OFFER, async (data: WebRTCOffer) => {
    await handleOffer(io, socket, user, data);
  });
  
  socket.on(WEBRTC_EVENTS.ANSWER, async (data: WebRTCAnswer) => {
    await handleAnswer(io, socket, user, data);
  });
  
  socket.on(WEBRTC_EVENTS.CANDIDATE, async (data: WebRTCCandidate) => {
    await handleCandidate(io, socket, user, data);
  });
}

async function handleOffer(
  io: SocketIOServer,
  socket: AuthenticatedSocket,
  user: User,
  data: WebRTCOffer
) {
  try {
    if (!isWebRTCOffer(data)) {
      socket.emit('error', {
        code: SIGNALING_ERRORS.INVALID_OFFER,
        message: 'Invalid offer data'
      });
      return;
    }
    
    const { roomId, offer } = data;
    
    // Verify user is in the room
    const userRoom = await getUserRoom(user.id);
    if (userRoom !== roomId) {
      socket.emit('error', {
        code: SIGNALING_ERRORS.USER_NOT_IN_ROOM,
        message: 'User not in specified room'
      });
      return;
    }
    
    // Get other users in the room
    const roomUsers = await getRoomUsers(roomId);
    const otherUsers = roomUsers.filter(u => u.id !== user.id);
    
    if (otherUsers.length === 0) {
      socket.emit('error', {
        code: SIGNALING_ERRORS.PEER_NOT_FOUND,
        message: 'No other peer in room'
      });
      return;
    }
    
    // Send offer to other peer(s)
    for (const otherUser of otherUsers) {
      const otherUserSockets = await getUserSockets(otherUser.id);
      
      for (const otherSocketId of otherUserSockets) {
        io.to(otherSocketId).emit(WEBRTC_EVENTS.OFFER, {
          roomId,
          offer,
          from: user.id
        });
      }
    }
    
    logger.info('WebRTC offer sent', { 
      roomId, 
      fromUserId: user.id, 
      toUsers: otherUsers.map(u => u.id) 
    });
    
  } catch (error) {
    logger.error('Failed to handle WebRTC offer', {
      userId: user.id,
      roomId: data.roomId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    socket.emit('error', {
      code: SIGNALING_ERRORS.INVALID_OFFER,
      message: 'Failed to process offer'
    });
  }
}

async function handleAnswer(
  io: SocketIOServer,
  socket: AuthenticatedSocket,
  user: User,
  data: WebRTCAnswer
) {
  try {
    if (!isWebRTCAnswer(data)) {
      socket.emit('error', {
        code: SIGNALING_ERRORS.INVALID_ANSWER,
        message: 'Invalid answer data'
      });
      return;
    }
    
    const { roomId, answer } = data;
    
    // Verify user is in the room
    const userRoom = await getUserRoom(user.id);
    if (userRoom !== roomId) {
      socket.emit('error', {
        code: SIGNALING_ERRORS.USER_NOT_IN_ROOM,
        message: 'User not in specified room'
      });
      return;
    }
    
    // Get other users in the room
    const roomUsers = await getRoomUsers(roomId);
    const otherUsers = roomUsers.filter(u => u.id !== user.id);
    
    if (otherUsers.length === 0) {
      socket.emit('error', {
        code: SIGNALING_ERRORS.PEER_NOT_FOUND,
        message: 'No other peer in room'
      });
      return;
    }
    
    // Send answer to other peer(s) - typically to the initiator
    for (const otherUser of otherUsers) {
      const otherUserSockets = await getUserSockets(otherUser.id);
      
      for (const otherSocketId of otherUserSockets) {
        io.to(otherSocketId).emit(WEBRTC_EVENTS.ANSWER, {
          roomId,
          answer,
          from: user.id
        });
      }
    }
    
    logger.info('WebRTC answer sent', { 
      roomId, 
      fromUserId: user.id, 
      toUsers: otherUsers.map(u => u.id) 
    });
    
  } catch (error) {
    logger.error('Failed to handle WebRTC answer', {
      userId: user.id,
      roomId: data.roomId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    socket.emit('error', {
      code: SIGNALING_ERRORS.INVALID_ANSWER,
      message: 'Failed to process answer'
    });
  }
}

async function handleCandidate(
  io: SocketIOServer,
  socket: AuthenticatedSocket,
  user: User,
  data: WebRTCCandidate
) {
  try {
    if (!isWebRTCCandidate(data)) {
      socket.emit('error', {
        code: SIGNALING_ERRORS.INVALID_CANDIDATE,
        message: 'Invalid candidate data'
      });
      return;
    }
    
    const { roomId, candidate } = data;
    
    // Verify user is in the room
    const userRoom = await getUserRoom(user.id);
    if (userRoom !== roomId) {
      socket.emit('error', {
        code: SIGNALING_ERRORS.USER_NOT_IN_ROOM,
        message: 'User not in specified room'
      });
      return;
    }
    
    // Get other users in the room
    const roomUsers = await getRoomUsers(roomId);
    const otherUsers = roomUsers.filter(u => u.id !== user.id);
    
    if (otherUsers.length === 0) {
      logger.debug('No other peer in room for candidate', { roomId, userId: user.id });
      return;
    }
    
    // Send ICE candidate to other peer(s)
    for (const otherUser of otherUsers) {
      const otherUserSockets = await getUserSockets(otherUser.id);
      
      for (const otherSocketId of otherUserSockets) {
        io.to(otherSocketId).emit(WEBRTC_EVENTS.CANDIDATE, {
          roomId,
          candidate,
          from: user.id
        });
      }
    }
    
    logger.debug('WebRTC candidate sent', { 
      roomId, 
      fromUserId: user.id, 
      toUsers: otherUsers.map(u => u.id) 
    });
    
  } catch (error) {
    logger.error('Failed to handle WebRTC candidate', {
      userId: user.id,
      roomId: data.roomId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    socket.emit('error', {
      code: SIGNALING_ERRORS.INVALID_CANDIDATE,
      message: 'Failed to process candidate'
    });
  }
}Room created successfully', { 
      roomId: newRoomId, 
      initiatorId 
    });
    
    return room;
  } catch (error) {
    logger.error('Failed to create room', { 
      initiatorId, 
      roomId,
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
}

export async function joinRoom(roomId: string, userId: string): Promise<{success: boolean, room?: Room}> {
  try {
    // Check if room exists in database
    const [room] = await db
      .select()
      .from(rooms)
      .where(eq(rooms.id, roomId))
      .limit(1);
    
    if (!room) {
      logger.warn('Attempt to join non-existent room', { roomId, userId });
      return { success: false };
    }
    
    // Check if room is full
    const isFull = await isRoomFull(roomId);
    if (isFull) {
      logger.warn('Attempt to join full room', { roomId, userId });
      return { success: false };
    }
    
    // Check if user is already in another room
    const currentRoom = await redisClient.get(REDIS_KEYS.USER_ROOM(userId));
    if (currentRoom && currentRoom !== roomId) {
      // Leave current room first
      await leaveRoom(currentRoom, userId);
    }
    
    const multi = redisClient.multi();
    
    // Add user to room
    multi.sadd(REDIS_KEYS.ROOM_USERS(roomId), userId);
    
    // Set user's current room
    multi.set(REDIS_KEYS.USER_ROOM(userId), roomId);
    
    // Update participant count
    multi.hincrby(REDIS_KEYS.ROOM_STATE(roomId), 'participantCount', 1);
    
    await multi.exec();
    
    // Update room status if it becomes active
    const participantCount = await redisClient.scard(REDIS_KEYS.ROOM_USERS(roomId));
    if (participantCount >= 2) {
      await redisClient.hset(REDIS_KEYS.ROOM_STATE(roomId), 'status', 'connecting');
      
      // Update database
      await db
        .update(rooms)
        .set({ 
          status: 'connecting',
          updatedAt: new Date()
        })
        .where(eq(rooms.id, roomId));
    }
    
    logger.info('User joined room successfully', { roomId, userId, participantCount });
    
    return { success: true, room };
  } catch (error) {
    logger.error('Failed to join room', { 
      roomId, 
      userId,
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return { success: false };
  }
}

export async function leaveRoom(roomId: string, userId: string): Promise<void> {
  try {
    const multi = redisClient.multi();
    
    // Remove user from room
    multi.srem(REDIS_KEYS.ROOM_USERS(roomId), userId);
    
    // Clear user's current room
    multi.del(REDIS_KEYS.USER_ROOM(userId));
    
    // Decrease participant count
    multi.hincrby(REDIS_KEYS.ROOM_STATE(roomId), 'participantCount', -1);
    
    await multi.exec();
    
    // Check remaining participants
    const remainingUsers = await redisClient.smembers(REDIS_KEYS.ROOM_USERS(roomId));
    
    if (remainingUsers.length === 0) {
      // Clean up empty room
      await redisClient.del(
        REDIS_KEYS.ROOM_USERS(roomId),
        REDIS_KEYS.ROOM_STATE(roomId),
        REDIS_KEYS.ROOM_PEERS(roomId)
      );
      
      // Update database
      await db
        .update(rooms)
        .set({ 
          status: 'closed',
          updatedAt: new Date()
        })
        .where(eq(rooms.id, roomId));
    } else if (remainingUsers.length === 1) {
      // Update room status to waiting
      await redisClient.hset(REDIS_KEYS.ROOM_STATE(roomId), 'status', 'waiting');
      
      await db
        .update(rooms)
        .set({ 
          status: 'waiting',
          updatedAt: new Date()
        })
        .where(eq(rooms.id, roomId));
    }
    
    logger.info('