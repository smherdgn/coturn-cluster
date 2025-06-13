import { Socket } from 'socket.io';
import { UserProfile, UserPermissions } from './user';
 
// Authenticated socket user
export interface SocketUser {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatar?: string;
  permissions: UserPermissions;
  roomId?: string;
  status: 'online' | 'away' | 'busy';
  connectedAt: Date;
  lastActiveAt: Date;
}

// Extended socket with user data
export interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
  isAuthenticated: boolean;
  rateLimitIdentifier: string;
}

// Socket event handlers type
export type SocketEventHandler<T = any> = (data: T, callback?: (response: any) => void) => void | Promise<void>;

// WebRTC signaling interfaces
export interface WebRTCOffer {
  roomId: string;
  targetUserId: string;
  offer: RTCSessionDescriptionInit;
  metadata?: {
    audio: boolean;
    video: boolean;
    screenShare: boolean;
  };
}

export interface WebRTCAnswer {
  roomId: string;
  targetUserId: string;
  answer: RTCSessionDescriptionInit;
}

export interface WebRTCIceCandidate {
  roomId: string;
  targetUserId: string;
  candidate: RTCIceCandidateInit;
}

// Media state change
export interface MediaStateChange {
  roomId: string;
  userId: string;
  mediaType: 'audio' | 'video' | 'screenShare';
  enabled: boolean;
  timestamp: Date;
}

// Chat message
export interface ChatMessage {
  roomId: string;
  message: string;
  messageType?: 'text' | 'system';
  metadata?: {
    mentions?: string[];
    attachments?: string[];
  };
}

// Typing indicator
export interface TypingIndicator {
  roomId: string;
  isTyping: boolean;
}

// Socket authentication request
export interface SocketAuthRequest {
  token: string;
  roomId?: string;
}

// Socket authentication response
export interface SocketAuthResponse {
  success: boolean;
  user?: UserProfile;
  error?: string;
  permissions?: UserPermissions;
}

// Socket error response
export interface SocketErrorResponse {
  error: string;
  code: string;
  details?: any;
  timestamp: Date;
}

// Socket validation error
export interface SocketValidationError {
  field: string;
  message: string;
  value?: any;
}

// Room update notification
export interface RoomUpdateNotification {
  roomId: string;
  updateType: 'settings' | 'participants' | 'status';
  data: any;
  timestamp: Date;
}

// Peer connection state
export interface PeerConnectionState {
  userId: string;
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
  iceGatheringState: RTCIceGatheringState;
  signallingState: RTCSignalingState;
  timestamp: Date;
}

// Connection quality metrics
export interface ConnectionQuality {
  userId: string;
  roomId: string;
  metrics: {
    rtt: number; // Round trip time
    packetLoss: number;
    jitter: number;
    bandwidth: {
      upload: number;
      download: number;
    };
    audio?: {
      bitrate: number;
      packetsLost: number;
      packetsReceived: number;
    };
    video?: {
      bitrate: number;
      packetsLost: number;
      packetsReceived: number;
      frameRate: number;
      resolution: {
        width: number;
        height: number;
      };
    };
  };
  timestamp: Date;
}

// Socket middleware context
export interface SocketMiddlewareContext {
  socket: AuthenticatedSocket;
  data: any;
  next: (error?: Error) => void;
}

// Rate limit info
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
  blocked: boolean;
}
