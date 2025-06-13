// WebRTC Signaling Constants

// Socket.io events
export const SOCKET_EVENTS = {
  // Connection events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',
  
  // Authentication events
  AUTH_REQUEST: 'auth:request',
  AUTH_SUCCESS: 'auth:success',
  AUTH_ERROR: 'auth:error',
  AUTH_REFRESH: 'auth:refresh',
  
  // Room events
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_CREATE: 'room:create',
  ROOM_UPDATE: 'room:update',
  ROOM_DELETE: 'room:delete',
  ROOM_LIST: 'room:list',
  ROOM_USERS: 'room:users',
  
  // WebRTC signaling events
  WEBRTC_OFFER: 'webrtc:offer',
  WEBRTC_ANSWER: 'webrtc:answer',
  WEBRTC_ICE_CANDIDATE: 'webrtc:ice-candidate',
  WEBRTC_PEER_JOINED: 'webrtc:peer-joined',
  WEBRTC_PEER_LEFT: 'webrtc:peer-left',
  
  // Media events
  MEDIA_STATE_CHANGE: 'media:state-change',
  SCREEN_SHARE_START: 'media:screen-share-start',
  SCREEN_SHARE_STOP: 'media:screen-share-stop',
  
  // Chat events
  CHAT_MESSAGE: 'chat:message',
  CHAT_TYPING: 'chat:typing',
  
  // Error events
  ERROR: 'error',
  VALIDATION_ERROR: 'validation:error',
} as const;

// Redis channels
export const REDIS_CHANNELS = {
  USER_EVENTS: 'user:events',
  ROOM_EVENTS: 'room:events',
  SIGNALING_EVENTS: 'signaling:events',
  SYSTEM_EVENTS: 'system:events',
} as const;

// Cache keys
export const CACHE_KEYS = {
  USER_SESSION: (userId: string) => `session:user:${userId}`,
  SOCKET_SESSION: (socketId: string) => `session:socket:${socketId}`,
  ROOM_SESSION: (roomId: string) => `session:room:${roomId}`,
  ROOM_PARTICIPANTS: (roomId: string) => `room:participants:${roomId}`,
  USER_ROOMS: (userId: string) => `user:rooms:${userId}`,
  REFRESH_TOKEN: (tokenId: string) => `refresh:token:${tokenId}`,
  RATE_LIMIT: (identifier: string) => `ratelimit:${identifier}`,
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// WebRTC configuration
export const WEBRTC_CONFIG = {
  ICE_GATHERING_TIMEOUT: 3000,
  CONNECTION_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
} as const;

// Room limits
export const ROOM_LIMITS = {
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_PARTICIPANTS: 8,
  MIN_PARTICIPANTS: 1,
  SESSION_TIMEOUT: 3600000, // 1 hour
} as const;

// User limits
export const USER_LIMITS = {
  MAX_USERNAME_LENGTH: 50,
  MIN_USERNAME_LENGTH: 3,
  MAX_DISPLAY_NAME_LENGTH: 100,
  MAX_EMAIL_LENGTH: 255,
  MIN_PASSWORD_LENGTH: 8,
  MAX_CONCURRENT_SESSIONS: 5,
} as const;

// Error codes
export const ERROR_CODES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  
  // Room errors
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  ROOM_FULL: 'ROOM_FULL',
  ROOM_PRIVATE: 'ROOM_PRIVATE',
  ROOM_CLOSED: 'ROOM_CLOSED',
  INVALID_ROOM_PASSWORD: 'INVALID_ROOM_PASSWORD',
  
  // Connection errors
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  PEER_CONNECTION_FAILED: 'PEER_CONNECTION_FAILED',
  SIGNALING_ERROR: 'SIGNALING_ERROR',
  
  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_DATA: 'INVALID_DATA',
  
  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

// Default permissions
export const DEFAULT_PERMISSIONS = {
  canSpeak: true,
  canVideo: true,
  canScreenShare: true,
  canChat: true,
  isModerator: false,
} as const;

// Media constraints
export const MEDIA_CONSTRAINTS = {
  AUDIO: {
    sampleRate: 48000,
    channelCount: 2,
    autoGainControl: true,
    echoCancellation: true,
    noiseSuppression: true,
  },
  VIDEO: {
    width: { min: 320, ideal: 1280, max: 1920 },
    height: { min: 240, ideal: 720, max: 1080 },
    frameRate: { min: 15, ideal: 30, max: 60 },
  },
} as const;

// Export types
export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
export type RedisChannel = typeof REDIS_CHANNELS[keyof typeof REDIS_CHANNELS];
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
export type HttpStatusCode = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];
