// ========================================
// SH 4: ROOM & WEBRTC HANDLERS
// ========================================
// Dosyalar:
// - src/signaling/services/room.service.ts
// - src/signaling/handlers/webrtc.handler.ts

// ==========================================
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
