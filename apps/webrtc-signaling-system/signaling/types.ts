// ==========================================

// WebRTC Signaling Types
export interface WebRTCOffer {
  roomId: string;
  offer: RTCSessionDescriptionInit;
}

export interface WebRTCAnswer {
  roomId: string;
  answer: RTCSessionDescriptionInit;
}

export interface WebRTCCandidate {
  roomId: string;
  candidate: RTCIceCandidateInit;
}

// Room Management Types
export interface RoomCreateRequest {
  roomId?: string;
}

export interface RoomCreateResponse {
  roomId: string;
  iceServers: RTCIceServer[];
}

export interface RoomJoinRequest {
  roomId: string;
}

export interface RoomJoinResponse {
  success: boolean;
  users?: import('../shared/types/user.js').User[];
  room?: import('../shared/types/room.js').Room;
  iceServers?: RTCIceServer[];
}

export interface RoomLeaveRequest {
  roomId: string;
}

export interface RoomLeaveResponse {
  success: boolean;
}

export interface RoomUserLeftEvent {
  userId: string;
  roomId: string;
}

export interface RoomUserJoinedEvent {
  userId: string;
  roomId: string;
  user: import('../shared/types/user.js').User;
}

// ICE Server Configuration Types
export interface ICEServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
  credentialType?: RTCIceCredentialType;
}

export interface TURNCredentials {
  username: string;
  credential: string;
}

// WebRTC Connection State Types
export interface WebRTCConnectionState {
  roomId: string;
  state: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
  iceGatheringState: RTCIceGatheringState;
}

// Signaling Error Types
export interface SignalingError {
  code: string;
  message: string;
  roomId?: string;
  userId?: string;
  details?: any;
}

export const SIGNALING_ERRORS = {
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  ROOM_FULL: 'ROOM_FULL',
  USER_NOT_IN_ROOM: 'USER_NOT_IN_ROOM',
  INVALID_OFFER: 'INVALID_OFFER',
  INVALID_ANSWER: 'INVALID_ANSWER',
  INVALID_CANDIDATE: 'INVALID_CANDIDATE',
  PEER_NOT_FOUND: 'PEER_NOT_FOUND',
  ROOM_CREATE_FAILED: 'ROOM_CREATE_FAILED',
  ROOM_JOIN_FAILED: 'ROOM_JOIN_FAILED'
} as const;

// Room Event Types
export const ROOM_EVENTS = {
  CREATE: 'room:create',
  JOIN: 'room:join',
  LEAVE: 'room:leave',
  USER_LEFT: 'room:user-left',
  USER_JOINED: 'room:user-joined',
  STATE_CHANGED: 'room:state-changed'
} as const;

// WebRTC Event Types
export const WEBRTC_EVENTS = {
  OFFER: 'webrtc:offer',
  ANSWER: 'webrtc:answer',
  CANDIDATE: 'webrtc:candidate',
  CONNECTION_STATE: 'webrtc:connection-state'
} as const;

// Room State Types
export type RoomState = 'waiting' | 'connecting' | 'connected' | 'disconnected';

export interface RoomStateUpdate {
  roomId: string;
  state: RoomState;
  participants: string[];
  timestamp: Date;
}

// Peer Information
export interface PeerInfo {
  userId: string;
  socketId: string;
  joinedAt: Date;
  role: 'initiator' | 'responder';
}

export interface RoomPeers {
  roomId: string;
  peers: PeerInfo[];
  maxPeers: number;
}

// Session Description Types
export interface SessionDescription {
  type: RTCSdpType;
  sdp: string;
}

// ICE Candidate Types
export interface IceCandidate {
  candidate: string;
  sdpMLineIndex: number | null;
  sdpMid: string | null;
  usernameFragment?: string;
}

// Stats and Monitoring Types
export interface ConnectionStats {
  roomId: string;
  userId: string;
  bytesReceived: number;
  bytesSent: number;
  packetsReceived: number;
  packetsSent: number;
  timestamp: Date;
}

export interface SignalingMetrics {
  totalRooms: number;
  activeConnections: number;
  totalOffers: number;
  totalAnswers: number;
  totalCandidates: number;
  failedConnections: number;
}

// Type Guards
export function isWebRTCOffer(data: any): data is WebRTCOffer {
  return data && 
         typeof data.roomId === 'string' && 
         data.offer && 
         typeof data.offer === 'object' &&
         data.offer.type && 
         data.offer.sdp;
}

export function isWebRTCAnswer(data: any): data is WebRTCAnswer {
  return data && 
         typeof data.roomId === 'string' && 
         data.answer && 
         typeof data.answer === 'object' &&
         data.answer.type && 
         data.answer.sdp;
}

export function isWebRTCCandidate(data: any): data is WebRTCCandidate {
  return data && 
         typeof data.roomId === 'string' && 
         data.candidate && 
         typeof data.candidate === 'object';
}

export function isRoomCreateRequest(data: any): data is RoomCreateRequest {
  return data && (data.roomId === undefined || typeof data.roomId === 'string');
}

export function isRoomJoinRequest(data: any): data is RoomJoinRequest {
  return data && typeof data.roomId === 'string';
}

export function isRoomLeaveRequest(data: any): data is RoomLeaveRequest {
  return data && typeof data.roomId === 'string';
}
