import jwt from 'jsonwebtoken';
import { AccessTokenPayload, RefreshTokenPayload } from '../types';
import { logger } from '../../shared/utils/logger';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const ACCESS_TOKEN_EXPIRES_IN = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // 7 days

export function generateAccessToken(userId: string, email: string): string {
  try {
    const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
      userId,
      email
    };
    
    return jwt.sign(payload, JWT_ACCESS_SECRET, { 
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      issuer: 'webrtc-signaling'
    });
  } catch (error) {
    logger.error('Error generating access token:', error);
    throw new Error('Failed to generate access token');
  }
}

export function generateRefreshToken(userId: string, tokenId: string): string {
  try {
    const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
      userId,
      tokenId
    };
    
    return jwt.sign(payload, JWT_REFRESH_SECRET, { 
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
      issuer: 'webrtc-signaling'
    });
  } catch (error) {
    logger.error('Error generating refresh token:', error);
    throw new Error('Failed to generate refresh token');
  }
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as AccessTokenPayload;
    return decoded;
  } catch (error) {
    logger.warn('Invalid access token:', error.message);
    return null;
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
    return decoded;
  } catch (error) {
    logger.warn('Invalid refresh token:', error.message);
    return null;
  }
}

