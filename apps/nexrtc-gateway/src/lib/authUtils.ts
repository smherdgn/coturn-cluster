
import jwt from 'jsonwebtoken'; // Using standard jsonwebtoken for server-side signing

export const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-for-dev-only-change-me';
export const ACCESS_TOKEN_NAME = 'accessToken';
export const REFRESH_TOKEN_NAME = 'refreshToken';
export const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
export const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

interface UserPayload {
  userId: string;
  email: string;
}

export function signAccessToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function signRefreshToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

// Verification (if needed server-side outside middleware, e.g. in API routes if not relying solely on middleware)
// Note: Middleware uses 'jose' for edge compatibility. Standard 'jsonwebtoken' is fine for regular Node.js server environments.
export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch (error) {
    return null;
  }
}
