
import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
import jwt from 'jsonwebtoken';
import { signAccessToken, JWT_SECRET, ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME, ACCESS_TOKEN_EXPIRY } from '@/lib/authUtils';
import type { User } from '@/types';
import { logger } from '@/lib/logger';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    logger.apiCall('Refresh token attempt with wrong method', {
      payload: { method: req.method },
      source: 'SERVER_API'
    });
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const refreshToken = req.cookies[REFRESH_TOKEN_NAME];

  if (!refreshToken) {
    logger.auth('Token refresh failed: No refresh token provided.', { source: 'SERVER_API' });
    return res.status(401).json({ message: 'Refresh token not found' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as User & { iat: number, exp: number };
    
    if (!decoded.userId || !decoded.email) {
        logger.auth('Token refresh failed: Invalid token payload.', { 
            user_email: decoded.email, 
            user_id_from_jwt: decoded.userId,
            source: 'SERVER_API',
            payload: { error: "Missing userId or email in decoded token" }
        });
        throw new Error("Invalid token payload");
    }
    
    const userPayload = { userId: decoded.userId, email: decoded.email };
    const newAccessToken = signAccessToken(userPayload);
    
    const accessTokenMaxAge = parseInt(ACCESS_TOKEN_EXPIRY.slice(0, -1)) * (ACCESS_TOKEN_EXPIRY.endsWith('m') ? 60 : ACCESS_TOKEN_EXPIRY.endsWith('h') ? 3600 : 1);

    const accessTokenCookie = serialize(ACCESS_TOKEN_NAME, newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: accessTokenMaxAge,
      path: '/',
    });

    res.setHeader('Set-Cookie', accessTokenCookie);
    logger.auth('Token refreshed successfully.', { 
        user_email: decoded.email, 
        user_id_from_jwt: decoded.userId,
        source: 'SERVER_API'
    });
    return res.status(200).json({ success: true, message: 'Token refreshed successfully', accessToken: newAccessToken });
  } catch (error: any) {
    logger.auth('Token refresh failed: Invalid or expired refresh token.', { 
        source: 'SERVER_API',
        payload: { error: error.message }
    });
    
    // Clear potentially invalid refresh token cookie
    const clearRefreshTokenCookie = serialize(REFRESH_TOKEN_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        expires: new Date(0), 
        path: '/',
      });
    // Also clear access token cookie as a precaution
    const clearAccessTokenCookie = serialize(ACCESS_TOKEN_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        expires: new Date(0),
        path: '/',
    });
    res.setHeader('Set-Cookie', [clearRefreshTokenCookie, clearAccessTokenCookie]);
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
}
