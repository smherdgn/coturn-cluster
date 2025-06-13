// ========================================
// SH 3: SIGNALING MODULE SETUP
// ========================================
// Dosyalar:
// - src/signaling/index.ts
// - src/signaling/types.ts

// ==========================================
// ==========================================
import type { Server as SocketIOServer } from 'socket.io';
import { handleRoomEvents } from './handlers/room.handler.js';
import { handleWebRTCEvents } from './handlers/webrtc.handler.js';

export default async function setupSignaling(io: SocketIOServer) {
  io.on('connection', (socket) => {
    handleRoomEvents(io, socket);
    handleWebRTCEvents(io, socket);
  });
}

// ==========================================
