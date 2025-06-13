import { Room } from '../database/schema';
import { ConnectedUser, UserPermissions } from './user';

// Room configuration interface
export interface RoomSettings {
  audioEnabled?: boolean;
  videoEnabled?: boolean;
  screenShareEnabled?: boolean;
  chatEnabled?: boolean;
  moderationEnabled?: boolean;
  maxParticipants?: number;
  isPrivate?: boolean;
  requirePassword?: boolean;
}

// Room state interface
export interface RoomState {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  settings: RoomSettings;
  status: 'active' | 'inactive' | 'closed';
  participantCount: number;
  participants: ConnectedUser[];
  createdAt: Date;
  updatedAt: Date;
}

// Room creation request
export interface CreateRoomRequest {
  name: string;
  description?: string;
  settings?: RoomSettings;
  password?: string;
}

// Room update request
export interface UpdateRoomRequest {
  name?: string;
  description?: string;
  settings?: Partial<RoomSettings>;
  password?: string;
}

// Room join request
export interface JoinRoomRequest {
  roomId: string;
  password?: string;
  userPermissions?: Partial<UserPermissions>;
}

// Room join response
export interface JoinRoomResponse {
  room: RoomState;
  userPermissions: UserPermissions;
  participants: ConnectedUser[];
}

// Room list item
export interface RoomListItem {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  participantCount: number;
  maxParticipants: number;
  isPrivate: boolean;
  requirePassword: boolean;
  status: 'active' | 'inactive' | 'closed';
  createdAt: Date;
}

// Room list response
export interface RoomListResponse {
  rooms: RoomListItem[];
  total: number;
  page: number;
  limit: number;
}

// Room event interface
export interface RoomEvent {
  type: 'room_created' | 'room_updated' | 'room_deleted' | 'room_joined' | 'room_left';
  roomId: string;
  userId?: string;
  data?: any;
  timestamp: Date;
}

// Room participant event
export interface RoomParticipantEvent {
  type: 'participant_joined' | 'participant_left' | 'participant_updated';
  roomId: string;
  participant: ConnectedUser;
  timestamp: Date;
}

// Room message
export interface RoomMessage {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  displayName?: string;
  message: string;
  timestamp: Date;
  messageType: 'text' | 'system' | 'media';
}

// Room statistics
export interface RoomStatistics {
  totalRooms: number;
  activeRooms: number;
  totalParticipants: number;
  averageParticipantsPerRoom: number;
  peakConcurrentUsers: number;
  lastUpdated: Date;
}

// Export database types
export type { Room };
