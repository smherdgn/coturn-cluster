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
