import { User, UserSession } from '../database/schema';

// User profile interface
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatar?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  lastActiveAt?: Date;
  createdAt: Date;
}

// User session interface
export interface UserSessionData {
  id: string;
  userId: string;
  roomId?: string;
  socketId?: string;
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
    browser?: string;
    os?: string;
    ip?: string;
  };
  connectionState: 'connected' | 'disconnected' | 'reconnecting';
  permissions: UserPermissions;
  joinedAt?: Date;
  leftAt?: Date;
  lastPingAt?: Date;
}

// User permissions interface
export interface UserPermissions {
  canSpeak?: boolean;
  canVideo?: boolean;
  canScreenShare?: boolean;
  canChat?: boolean;
  isModerator?: boolean;
}

// Authentication interfaces
export interface LoginRequest {
  email: string;
  password: string;
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
    ip?: string;
  };
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  displayName?: string;
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
    ip?: string;
  };
}

export interface AuthResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ProfileUpdateRequest {
  username?: string;
  displayName?: string;
  avatar?: string;
}

// User status
export type UserStatus = 'online' | 'away' | 'busy' | 'offline';

// Connected user info
export interface ConnectedUser {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  status: UserStatus;
  permissions: UserPermissions;
  joinedAt: Date;
  lastActiveAt: Date;
}

// User connection event
export interface UserConnectionEvent {
  type: 'user_joined' | 'user_left' | 'user_updated';
  user: ConnectedUser;
  roomId?: string;
  timestamp: Date;
}

// Export database types
export type { User, UserSession };
