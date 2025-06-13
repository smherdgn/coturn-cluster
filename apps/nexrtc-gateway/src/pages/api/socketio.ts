import type { NextApiRequest, NextApiResponse } from "next";
import { Server as SocketIOServer, Socket } from "socket.io";
import type { Server as HTTPServer } from "http";
import { parse as parseCookie } from "cookie";
import jwt from "jsonwebtoken";
import { JWT_SECRET, ACCESS_TOKEN_NAME } from "@/lib/authUtils";
import { isRateLimited } from "@/lib/rateLimiter";
import { logEvent } from "@/lib/logEvent";
import type {
  User,
  SocketOfferData,
  SocketAnswerData,
  SocketIceCandidateData,
  SocketWebRTCStateData,
} from "@/types";
import { logger } from "@/lib/logger";
import {
  addSession,
  updateSession,
  removeSession,
  getSession,
  getAllSessions,
} from "@/lib/sessionManager";

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: NextApiRequest["socket"] & {
    server: HTTPServer & {
      io?: SocketIOServer;
    };
  };
}

interface AuthenticatedSocket extends Socket {
  user?: User;
}

const SOCKET_PATH = process.env.NEXT_PUBLIC_SOCKET_PATH || "/api/socketio";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function socketIOHandler(res: NextApiResponseWithSocket) {
  if (!res.socket.server.io) {
    logger.info("SERVER_SOCKET", "*Initializing Socket.IO server*");
    const io = new SocketIOServer(res.socket.server, {
      path: SOCKET_PATH,
      addTrailingSlash: false,
      cors: {
        origin: [
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "https://your-mobile-app.com",
        ],
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    io.use((socket: Socket, next) => {
      const socketId = socket.id;
      const ip = socket.handshake.address;
      if (isRateLimited(ip, 20, 60_000)) {
        logEvent('socket-rate-limit', { ip });
        return next(new Error('Rate limit exceeded'));
      }

      const authToken = socket.handshake.auth?.token as string | undefined;
      let token = authToken;
      if (!token) {
        const cookies = socket.handshake.headers.cookie;
        if (cookies) {
          const parsedCookies = parseCookie(cookies);
          token = parsedCookies[ACCESS_TOKEN_NAME];
        }
      }

      if (!token) {
        logger.auth("Socket Auth Failed: No access token", {
          socket_id: socketId,
          source: "SERVER_SOCKET",
          message: null,
        });
        return next(new Error("Authentication error: Access token missing."));
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as User & {
          iat: number;
          exp: number;
        };
        if (!decoded.userId || !decoded.email) {
          logger.auth("Socket Auth Failed: Invalid token payload", {
            socket_id: socketId,
            source: "SERVER_SOCKET",
            payload: { reason: "Missing userId or email" },
            message: null,
          });
          return next(
            new Error("Authentication error: Invalid token payload.")
          );
        }
        (socket as AuthenticatedSocket).user = {
          userId: decoded.userId,
          email: decoded.email,
        };
        logger.auth("Socket Authenticated", {
          user_email: decoded.email,
          user_id_from_jwt: decoded.userId,
          socket_id: socketId,
          source: "SERVER_SOCKET",
          message: null,
        });
        next();
      } catch (err: any) {
        logger.auth("Socket Auth Failed: Token verification error", {
          socket_id: socketId,
          source: "SERVER_SOCKET",
          payload: { error: err.message },
          message: null,
        });
        return next(
          new Error("Authentication error: Invalid or expired token.")
        );
      }
    });

    io.on("connection", (socket: Socket) => {
      const authSocket = socket as AuthenticatedSocket;
      const user = authSocket.user;

      if (!user) {
        logger.error(
          "SERVER_SOCKET",
          `Socket ${socket.id} connected without user context. Disconnecting.`,
          { socket_id: socket.id }
        );
        socket.disconnect(true);
        return;
      }
      logger.info("SERVER_SOCKET", `User connected to Socket.IO`, {
        user_email: user.email,
        user_id_from_jwt: user.userId,
        socket_id: socket.id,
        message: null,
      });
      addSession(user.userId, socket.id);
      io.emit("status-update", getAllSessions());

      socket.on("join-room", ({ roomId }) => {
        socket.join(roomId);
        updateSession(socket.id, { roomId, status: "signaling" });
        io.emit("status-update", getAllSessions());
        logger.roomEvent("SERVER_SOCKET", `User joined room`, {
          user_email: user.email,
          user_id_from_jwt: user.userId,
          socket_id: socket.id,
          room_id: roomId,
          message: null,
        });
        socket
          .to(roomId)
          .emit("user-joined", { userId: socket.id, email: user.email });
      });

      socket.on("start-call", () => {
        updateSession(socket.id, { status: "in-call" });
        io.emit("status-update", getAllSessions());
      });

      socket.on("offer", (data: SocketOfferData) => {
        logger.signaling(
          "SERVER_SOCKET",
          `Relaying offer to ${data.toUserId}`,
          {
            user_email: user.email,
            socket_id: socket.id,
            room_id: Array.from(socket.rooms)[1], // Assuming second room is the actual room ID
            peer_socket_id: data.toUserId,
            payload: { offerSize: JSON.stringify(data.offer).length },
            message: null,
          }
        );
        socket
          .to(data.toUserId)
          .emit("offer", { offer: data.offer, fromUserId: socket.id });
      });

      socket.on("answer", (data: SocketAnswerData) => {
        logger.signaling(
          "SERVER_SOCKET",
          `Relaying answer to ${data.toUserId}`,
          {
            user_email: user.email,
            socket_id: socket.id,
            room_id: Array.from(socket.rooms)[1],
            peer_socket_id: data.toUserId,
            payload: { answerSize: JSON.stringify(data.answer).length },
            message: null,
          }
        );
        socket
          .to(data.toUserId)
          .emit("answer", { answer: data.answer, fromUserId: socket.id });
      });

      socket.on("ice-candidate", (data: SocketIceCandidateData) => {
        // These can be very noisy, log selectively or summarize if needed
        // logger.signaling('SERVER_SOCKET', `Relaying ICE candidate to ${data.toUserId}`, {
        //     user_email: user.email, socket_id: socket.id, room_id: Array.from(socket.rooms)[1],
        //     peer_socket_id: data.toUserId, payload: data.candidate ? { candidateType: data.candidate.type, sdpMid: data.candidate.sdpMid } : {candidate: null}
        // });
        socket.to(data.toUserId).emit("ice-candidate", {
          candidate: data.candidate,
          fromUserId: socket.id,
        });
      });

      socket.on("webrtc-state-change", (data: SocketWebRTCStateData) => {
        logger.webrtcEvent(
          "SERVER_SOCKET",
          `Client WebRTC state change for peer ${data.peerSocketId}`,
          {
            user_email: user.email,
            socket_id: socket.id,
            room_id: Array.from(socket.rooms)[1],
            peer_socket_id: data.peerSocketId,
            webrtc_ice_state: data.iceState,
            webrtc_signaling_state: data.signalingState,
            source: "CLIENT_APP",
            message: null,
          }
        );
      });

      socket.on("chat-message", (msg: { message: string; timestamp: number }) => {
        const roomIdArray = Array.from(socket.rooms);
        const currentRoom = roomIdArray.find((r) => r !== socket.id);
        if (currentRoom) {
          socket.to(currentRoom).emit("chat-message", {
            userId: user.userId,
            message: msg.message,
            timestamp: msg.timestamp,
          });
        }
      });

      socket.on("file-meta", (data: any) => {
        const roomIdArray = Array.from(socket.rooms);
        const currentRoom = roomIdArray.find((r) => r !== socket.id);
        if (currentRoom) {
          socket.to(currentRoom).emit("file-meta", data);
        }
      });

      socket.on("reconnect", (roomId: string) => {
        socket.join(roomId);
        socket.to(roomId).emit("reconnect", { userId: socket.id });
      });

      socket.on("end-call", (data: { toUserId?: string }) => {
        const roomIdArray = Array.from(socket.rooms);
        const currentRoom = roomIdArray.find((r) => r !== socket.id);
        logger.signaling("SERVER_SOCKET", `Relaying end-call signal`, {
          user_email: user.email,
          socket_id: socket.id,
          room_id: currentRoom,
          peer_socket_id: data.toUserId,
          message: `Call end signal from ${user.email} (${
            socket.id
          }). Target: ${data.toUserId || "room " + currentRoom}`,
        });
        if (data.toUserId) {
          socket
            .to(data.toUserId)
            .emit("call-ended", { fromUserId: socket.id });
        } else if (currentRoom) {
          socket.to(currentRoom).emit("call-ended", { fromUserId: socket.id });
        }
      });

      socket.on("disconnecting", () => {
        const disconnectingUser = (socket as AuthenticatedSocket).user;
        const logDetails = {
          user_email: disconnectingUser?.email,
          user_id_from_jwt: disconnectingUser?.userId,
          socket_id: socket.id,
          source: "SERVER_SOCKET" as const,
          message: null,
        };
        logger.info("SERVER_SOCKET", `User disconnecting`, logDetails);
        socket.rooms.forEach((room) => {
          if (room !== socket.id) {
            logger.roomEvent(
              "SERVER_SOCKET",
              `User left room (disconnecting)`,
              {
                ...logDetails,
                room_id: room,
                message: null,
              }
            );
            socket.to(room).emit("user-left", socket.id);
          }
        });
      });

      socket.on("disconnect", () => {
        const disconnectedUser = (socket as AuthenticatedSocket).user;
        const session = getSession(socket.id);
        if (session?.roomId) {
          socket.to(session.roomId).emit("user-disconnected", { userId: socket.id });
        }
        removeSession(socket.id);
        io.emit("status-update", getAllSessions());
        logger.info("SERVER_SOCKET", `User disconnected`, {
          user_email: disconnectedUser?.email,
          user_id_from_jwt: disconnectedUser?.userId,
          socket_id: socket.id,
          source: "SERVER_SOCKET",
          message: null,
        });
      });
    });

    res.socket.server.io = io;
  } else {
    // logger.info('SERVER_SOCKET', 'Socket.IO server already running');
  }
  res.end();
}
