// ========================================
// SH 2: USER PRESENCE MANAGEMENT
// ========================================
// Dosyalar:
// - src/websocket/services/presence.service.ts
// - src/websocket/handlers/connection.handler.ts

// ==========================================
// src/websocket/services/presence.service.ts
// ==========================================
import type { Server as SocketIOServer } from 'socket.io';
import { redisClient } from '../../shared/redis/connection.js';
import { logger } from '../../shared/utils/logger.js';
import { SOCKET_EVENTS } from '../types.js';

const REDIS_KEYS = {
  USER_SOCKETS: (userId: string) => `user:sockets:${userId}`,
  SOCKET_USER: (socketId: string) => `socket:user:${socketId}`,
  ONLINE_USERS: 'users:online'
} as const;

export async function addUserOnline(userId: string, socketId: string): Promise<void> {
  try {
    const multi = redisClient.multi();
    
    // Add socket to user's socket set
    multi.sadd(REDIS_KEYS.USER_SOCKETS(userId), socketId);
    
    // Map socket to user
    multi.set(REDIS_KEYS.SOCKET_USER(socketId), userId);
    
    // Add user to online users set
    multi.sadd(REDIS_KEYS.ONLINE_USERS, userId);
    
    // Set expiration for socket mapping (5 minutes)
    multi.expire(REDIS_KEYS.SOCKET_USER(socketId), 300);
    
    await multi.exec();
    
    logger.info('User added to online status', { userId, socketId });
  } catch (error) {
    logger.error('Failed to add user online', { 
      userId, 
      socketId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
}

export async function removeUserOnline(userId: string, socketId: string): Promise<void> {
  try {
    const multi = redisClient.multi();
    
    // Remove socket from user's socket set
    multi.srem(REDIS_KEYS.USER_SOCKETS(userId), socketId);
    
    // Remove socket-user mapping
    multi.del(REDIS_KEYS.SOCKET_USER(socketId));
    
    await multi.exec();
    
    // Check if user still has other sockets
    const remainingSockets = await redisClient.scard(REDIS_KEYS.USER_SOCKETS(userId));
    
    if (remainingSockets === 0) {
      // Remove user from online users set
      await redisClient.srem(REDIS_KEYS.ONLINE_USERS, userId);
      // Clean up empty socket set
      await redisClient.del(REDIS_KEYS.USER_SOCKETS(userId));
    }
    
    logger.info('User removed from online status', { 
      userId, 
      socketId, 
      remainingSockets 
    });
  } catch (error) {
    logger.error('Failed to remove user online', { 
      userId, 
      socketId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
}

export async function getUserSockets(userId: string): Promise<string[]> {
  try {
    const sockets = await redisClient.smembers(REDIS_KEYS.USER_SOCKETS(userId));
    return sockets;
  } catch (error) {
    logger.error('Failed to get user sockets', { 
      userId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return [];
  }
}

export async function isUserOnline(userId: string): Promise<boolean> {
  try {
    const isOnline = await redisClient.sismember(REDIS_KEYS.ONLINE_USERS, userId);
    return Boolean(isOnline);
  } catch (error) {
    logger.error('Failed to check user online status', { 
      userId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return false;
  }
}

export async function broadcastUserStatus(
  io: SocketIOServer, 
  userId: string, 
  status: 'online' | 'offline'
): Promise<void> {
  try {
    const eventName = status === 'online' ? SOCKET_EVENTS.USER_ONLINE : SOCKET_EVENTS.USER_OFFLINE;
    
    // Broadcast to all connected clients
    io.emit(eventName, { userId });
    
    logger.info('User status broadcasted', { userId, status });
  } catch (error) {
    logger.error('Failed to broadcast user status', { 
      userId, 
      status, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

export async function getOnlineUsers(): Promise<string[]> {
  try {
    const onlineUsers = await redisClient.smembers(REDIS_KEYS.ONLINE_USERS);
    return onlineUsers;
  } catch (error) {
    logger.error('Failed to get online users', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return [];
  }
}

export async function cleanupStaleConnections(): Promise<void> {
  try {
    // This function can be called periodically to clean up stale connections
    const onlineUsers = await getOnlineUsers();
    
    for (const userId of onlineUsers) {
      const sockets = await getUserSockets(userId);
      if (sockets.length === 0) {
        await redisClient.srem(REDIS_KEYS.ONLINE_USERS, userId);
        await redisClient.del(REDIS_KEYS.USER_SOCKETS(userId));
      }
    }
    
    logger.info('Cleanup completed', { processedUsers: onlineUsers.length });
  } catch (error) {
    logger.error('Failed to cleanup stale connections', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

// ==========================================
// src/websocket/handlers/connection.handler.ts
// ==========================================
import type { Server as SocketIOServer } from 'socket.io';
import type { AuthenticatedSocket } from '../types.js';
import type { User } from '../../shared/types/user.js';
import { 
  addUserOnline, 
  removeUserOnline, 
  broadcastUserStatus,
  isUserOnline 
} from '../services/presence.service.js';
import { logger } from '../../shared/utils/logger.js';

export function handleConnection(io: SocketIOServer, socket: AuthenticatedSocket) {
  const user = socket.data.user as User;
  
  logger.info('User connected', { 
    userId: user.id, 
    email: user.email, 
    socketId: socket.id 
  });

  // Handle user online status
  handleUserOnline(io, socket, user);
  
  // Handle disconnection
  socket.on('disconnect', () => handleDisconnect(io, socket, user));
  
  // Handle ping/pong for keep-alive
  socket.on('ping', () => {
    socket.emit('pong');
  });
  
  // Handle user activity tracking
  socket.on('user:activity', () => {
    // Update last activity timestamp if needed
    logger.debug('User activity', { userId: user.id, socketId: socket.id });
  });
}

async function handleUserOnline(
  io: SocketIOServer, 
  socket: AuthenticatedSocket, 
  user: User
) {
  try {
    // Check if user was already online
    const wasOnline = await isUserOnline(user.id);
    
    // Add user to online status
    await addUserOnline(user.id, socket.id);
    
    // If user wasn't online before, broadcast the status
    if (!wasOnline) {
      await broadcastUserStatus(io, user.id, 'online');
    }
    
    // Send current online users to the newly connected user
    const onlineUsers = await getOnlineUsers();
    socket.emit('users:online', { users: onlineUsers });
    
  } catch (error) {
    logger.error('Failed to handle user online', { 
      userId: user.id, 
      socketId: socket.id,
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

async function handleDisconnect(
  io: SocketIOServer, 
  socket: AuthenticatedSocket, 
  user: User
) {
  try {
    logger.info('User disconnected', { 
      userId: user.id, 
      socketId: socket.id 
    });
    
    // Remove user from online status
    await removeUserOnline(user.id, socket.id);
    
    // Check if user is still online (has other sockets)
    const stillOnline = await isUserOnline(user.id);
    
    // If user is completely offline, broadcast the status
    if (!stillOnline) {
      await broadcastUserStatus(io, user.id, 'offline');
    }
    
  } catch (error) {
    logger.error('Failed to handle user disconnect', { 
      userId: user.id, 
      socketId: socket.id,
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

// Import for online users (needed in handleUserOnline)
import { getOnlineUsers } from '../services/presence.service.js';