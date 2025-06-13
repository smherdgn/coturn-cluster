import type { Socket } from 'socket.io';
import { validateToken } from '../../auth/services/auth.service.js';
import { logger } from '../../src/shared/utils/logger';

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

 