import { z } from 'zod';
import { USER_LIMITS, ROOM_LIMITS } from '../config/constants';

// Common validation patterns
const email = z.string()
  .email('Invalid email format')
  .max(USER_LIMITS.MAX_EMAIL_LENGTH, `Email too long (max ${USER_LIMITS.MAX_EMAIL_LENGTH} characters)`);

const password = z.string()
  .min(USER_LIMITS.MIN_PASSWORD_LENGTH, `Password too short (min ${USER_LIMITS.MIN_PASSWORD_LENGTH} characters)`)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and numbers');

const username = z.string()
  .min(USER_LIMITS.MIN_USERNAME_LENGTH, `Username too short (min ${USER_LIMITS.MIN_USERNAME_LENGTH} characters)`)
  .max(USER_LIMITS.MAX_USERNAME_LENGTH, `Username too long (max ${USER_LIMITS.MAX_USERNAME_LENGTH} characters)`)
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscore, and dash');

const roomName = z.string()
  .min(1, 'Room name is required')
  .max(ROOM_LIMITS.MAX_NAME_LENGTH, `Room name too long (max ${ROOM_LIMITS.MAX_NAME_LENGTH} characters)`)
  .trim();

// Security validation schemas
export const securitySchemas = {
  // Auth schemas
  login: z.object({
    email,
    password: z.string().min(1, 'Password is required'),
    deviceInfo: z.object({
      userAgent: z.string().optional(),
      platform: z.string().optional(),
      ip: z.string().optional(),
    }).optional(),
  }),

  register: z.object({
    email,
    username,
    password,
    displayName: z.string()
      .max(USER_LIMITS.MAX_DISPLAY_NAME_LENGTH, `Display name too long (max ${USER_LIMITS.MAX_DISPLAY_NAME_LENGTH} characters)`)
      .optional(),
    deviceInfo: z.object({
      userAgent: z.string().optional(),
      platform: z.string().optional(),
      ip: z.string().optional(),
    }).optional(),
  }),

  refreshToken: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: password,
  }),

  // Room schemas
  createRoom: z.object({
    name: roomName,
    description: z.string()
      .max(ROOM_LIMITS.MAX_DESCRIPTION_LENGTH, `Description too long (max ${ROOM_LIMITS.MAX_DESCRIPTION_LENGTH} characters)`)
      .optional(),
    settings: z.object({
      audioEnabled: z.boolean().optional(),
      videoEnabled: z.boolean().optional(),
      screenShareEnabled: z.boolean().optional(),
      chatEnabled: z.boolean().optional(),
      moderationEnabled: z.boolean().optional(),
      maxParticipants: z.number()
        .min(ROOM_LIMITS.MIN_PARTICIPANTS)
        .max(ROOM_LIMITS.MAX_PARTICIPANTS)
        .optional(),
      isPrivate: z.boolean().optional(),
      requirePassword: z.boolean().optional(),
    }).optional(),
    password: z.string().min(4, 'Room password must be at least 4 characters').optional(),
  }),

  joinRoom: z.object({
    roomId: z.string().uuid('Invalid room ID'),
    password: z.string().optional(),
    userPermissions: z.object({
      canSpeak: z.boolean().optional(),
      canVideo: z.boolean().optional(),
      canScreenShare: z.boolean().optional(),
      canChat: z.boolean().optional(),
      isModerator: z.boolean().optional(),
    }).optional(),
  }),

  // WebRTC schemas
  webrtcOffer: z.object({
    roomId: z.string().uuid('Invalid room ID'),
    targetUserId: z.string().uuid('Invalid target user ID'),
    offer: z.object({
      type: z.literal('offer'),
      sdp: z.string().min(1, 'SDP is required'),
    }),
    metadata: z.object({
      audio: z.boolean(),
      video: z.boolean(),
      screenShare: z.boolean(),
    }).optional(),
  }),

  webrtcAnswer: z.object({
    roomId: z.string().uuid('Invalid room ID'),
    targetUserId: z.string().uuid('Invalid target user ID'),
    answer: z.object({
      type: z.literal('answer'),
      sdp: z.string().min(1, 'SDP is required'),
    }),
  }),

  webrtcIceCandidate: z.object({
    roomId: z.string().uuid('Invalid room ID'),
    targetUserId: z.string().uuid('Invalid target user ID'),
    candidate: z.object({
      candidate: z.string(),
      sdpMLineIndex: z.number().optional(),
      sdpMid: z.string().optional(),
    }),
  }),

  // Chat schemas
  chatMessage: z.object({
    roomId: z.string().uuid('Invalid room ID'),
    message: z.string()
      .min(1, 'Message cannot be empty')
      .max(1000, 'Message too long (max 1000 characters)')
      .trim(),
    messageType: z.enum(['text', 'system']).optional(),
    metadata: z.object({
      mentions: z.array(z.string().uuid()).optional(),
      attachments: z.array(z.string()).optional(),
    }).optional(),
  }),
};

// Sanitization functions
export const sanitizers = {
  // Sanitize HTML input
  html: (input: string): string => {
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  },

  // Sanitize SQL input (basic)
  sql: (input: string): string => {
    return input
      .replace(/['";\\]/g, '') // Remove SQL injection characters
      .trim();
  },

  // Sanitize room name
  roomName: (input: string): string => {
    return input
      .replace(/[^\w\s-]/g, '') // Only allow word characters, spaces, and dashes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  },

  // Sanitize username
  username: (input: string): string => {
    return input
      .replace(/[^\w-]/g, '') // Only allow word characters and dashes
      .toLowerCase()
      .trim();
  },
};

// Input validation middleware factory
export function createValidationMiddleware(schema: z.ZodSchema) {
  return async (request: any, reply: any) => {
    try {
      const validatedData = schema.parse(request.body);
      request.validatedBody = validatedData;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        reply.status(400).send({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_FAILED',
          details: validationErrors,
          timestamp: new Date(),
        });
        return;
      }
      throw error;
    }
  };
}
