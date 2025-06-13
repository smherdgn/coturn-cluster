import { eq, and } from 'drizzle-orm';
import { db } from '../../src/shared/database/connection';
import { users, refreshTokens } from '../../src/shared/database/schema';
import { redisClient } from '../../src/shared/redis/connection';
import { User } from '../../src/shared/types/user';
import { createUser, findUserByEmail, findUserById } from './user.service';
import { comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from '../utils/jwt';
import { logger } from '../../src/shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';
 
interface AuthTokens {
  access: string;
  refresh: string;
}

interface AuthResult {
  user: User;
  tokens: AuthTokens;
}

export async function register(email: string, password: string, name: string): Promise<AuthResult> {
  try {
    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Create new user
    const user = await createUser(email, password, name);
    
    // Generate tokens
    const tokenId = uuidv4();
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, tokenId);
    
    // Store refresh token in database
    await db.insert(refreshTokens).values({
      id: tokenId,
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date()
    });

    // Cache user session in Redis (15 minutes - same as access token)
    await redisClient.setEx(`user_session:${user.id}`, 900, JSON.stringify(user));

    logger.info(`User registered and logged in: ${email}`);

    return {
      user,
      tokens: {
        access: accessToken,
        refresh: refreshToken
      }
    };
  } catch (error) {
    logger.error('Registration error:', error);
    throw error;
  }
}

export async function login(email: string, password: string): Promise<AuthResult> {
  try {
    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const tokenId = uuidv4();
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, tokenId);
    
    // Store refresh token in database
    await db.insert(refreshTokens).values({
      id: tokenId,
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date()
    });

    // Cache user session in Redis
    const { password: _, ...userWithoutPassword } = user;
    await redisClient.setEx(`user_session:${user.id}`, 900, JSON.stringify(userWithoutPassword));

    logger.info(`User logged in: ${email}`);

    return {
      user: userWithoutPassword as User,
      tokens: {
        access: accessToken,
        refresh: refreshToken
      }
    };
  } catch (error) {
    logger.error('Login error:', error);
    throw error;
  }
}

export async function refreshToken(refreshTokenValue: string): Promise<{ accessToken: string }> {
  try {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshTokenValue);
    if (!payload) {
      throw new Error('Invalid refresh token');
    }

    // Check if refresh token exists in database and is not expired
    const [tokenRecord] = await db
      .select()
      .from(refreshTokens)
      .where(and(
        eq(refreshTokens.id, payload.tokenId),
        eq(refreshTokens.userId, payload.userId)
      ))
      .limit(1);

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new Error('Refresh token expired or not found');
    }

    // Get user
    const user = await findUserById(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate new access token
    const accessToken = generateAccessToken(user.id, user.email);

    // Update user session cache in Redis
    await redisClient.setEx(`user_session:${user.id}`, 900, JSON.stringify(user));

    logger.info(`Token refreshed for user: ${user.email}`);

    return { accessToken };
  } catch (error) {
    logger.error('Token refresh error:', error);
    throw error;
  }
}

export async function logout(refreshTokenValue: string): Promise<void> {
  try {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshTokenValue);
    if (!payload) {
      throw new Error('Invalid refresh token');
    }

    // Remove refresh token from database
    await db
      .delete(refreshTokens)
      .where(and(
        eq(refreshTokens.id, payload.tokenId),
        eq(refreshTokens.userId, payload.userId)
      ));

    // Remove user session from Redis
    await redisClient.del(`user_session:${payload.userId}`);

    logger.info(`User logged out: ${payload.userId}`);
  } catch (error) {
    logger.error('Logout error:', error);
    throw error;
  }
}

export async function validateToken(accessToken: string): Promise<{
  email: any;
  id: any; valid: boolean; user?: User 
}> {
  try {
    const payload = verifyAccessToken(accessToken);
    if (!payload) {
      return { valid: false, email: null, id: null };
    }

    // Try to get user from Redis cache first
    const cachedUser = await redisClient.get(`user_session:${payload.userId}`);
    if (cachedUser) {
      const user = JSON.parse(cachedUser);
      return {
        valid: true,
        user: user,
        email: user.email,
        id: user.id
      };
    }

    // If not in cache, get from database
    const user = await findUserById(payload.userId);
    if (!user) {
      return { valid: false, email: null, id: null };
    }

    // Cache the user for future requests
    await redisClient.setEx(`user_session:${user.id}`, 900, JSON.stringify(user));

    return {
      valid: true,
      user,
      email: user.email,
      id: user.id
    };
  } catch (error) {
    logger.error('Token validation error:', error);
    return { valid: false, email: null, id: null };
  }
}
