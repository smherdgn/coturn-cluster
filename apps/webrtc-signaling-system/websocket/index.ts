// ========================================
// SH 1: WEBSOCKET MODULE SETUP
// ========================================
// Dosyalar:
// - src/websocket/index.ts
// - src/websocket/middleware/socket-auth.ts
// - src/websocket/types.ts

// ==========================================
// ==========================================
import type { Server as SocketIOServer } from 'socket.io';
import { socketAuthMiddleware } from './middleware/socket-auth.js';
import { handleConnection } from './handlers/connection.handler.js';

export default async function setupWebSocket(io: SocketIOServer) {
  io.use(socketAuthMiddleware);
  io.on('connection', (socket) => handleConnection(io, socket));
}

// ==========================================
