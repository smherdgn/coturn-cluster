import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";
import {
  signAccessToken,
  signRefreshToken,
  ACCESS_TOKEN_NAME,
  REFRESH_TOKEN_NAME,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
} from "@/lib/authUtils";
import { getConfigValue } from "@/lib/config";
import { logger } from "@/lib/logger";
import { isRateLimited } from "@/lib/rateLimiter";
import { logEvent } from "@/lib/logEvent";
 
 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    logger.apiCall("Login attempt with wrong method", {
      user_email: req.body?.email,
      payload: { method: req.method },
      message: "Method Not Allowed",
    });
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress) as string;
  if (isRateLimited(`login:${ip}`, 5, 60_000)) {
    logEvent('login-rate-limit', { ip });
    return res.status(429).json({ message: 'Too many attempts' });
  }

  const { email, password } = req.body;

 
 
  const DEMO_USER_EMAIL =
    (await getConfigValue('demo_user_email')) || 'user@example.com';
  const DEMO_USER_PASSWORD =
    (await getConfigValue('demo_user_password')) || 'password123';
  const ADMIN_USER_EMAIL =
    (await getConfigValue('admin_email')) || 'admin@example.com';
  const ADMIN_USER_PASSWORD =
    (await getConfigValue('admin_password')) || 'adminpassword123';
 
  let userPayload;
  let loginSuccess = false;

  if (email === DEMO_USER_EMAIL && password === DEMO_USER_PASSWORD) {
    userPayload = { userId: email, email: email };
    loginSuccess = true;
  } else if (email === ADMIN_USER_EMAIL && password === ADMIN_USER_PASSWORD) {
    userPayload = { userId: email, email: email }; // Could add role: 'admin' to payload if desired
    loginSuccess = true;
  }

  if (loginSuccess && userPayload) {
    const accessToken = signAccessToken(userPayload);
    const refreshToken = signRefreshToken(userPayload);

    // Note: MaxAge for cookies in `serialize` expects seconds.
    // ACCESS_TOKEN_EXPIRY is '15m', REFRESH_TOKEN_EXPIRY is '7d'. Convert them.
    const accessTokenMaxAge =
      parseInt(ACCESS_TOKEN_EXPIRY.slice(0, -1)) *
      (ACCESS_TOKEN_EXPIRY.endsWith("m")
        ? 60
        : ACCESS_TOKEN_EXPIRY.endsWith("h")
        ? 3600
        : 1);
    const refreshTokenMaxAge =
      parseInt(REFRESH_TOKEN_EXPIRY.slice(0, -1)) *
      (REFRESH_TOKEN_EXPIRY.endsWith("d")
        ? 86400
        : REFRESH_TOKEN_EXPIRY.endsWith("h")
        ? 3600
        : 1);

    const accessTokenCookie = serialize(ACCESS_TOKEN_NAME, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "strict",
      maxAge: accessTokenMaxAge,
      path: "/",
    });

    const refreshTokenCookie = serialize(REFRESH_TOKEN_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "strict",
      maxAge: refreshTokenMaxAge,
      path: "/",
    });

    res.setHeader("Set-Cookie", [accessTokenCookie, refreshTokenCookie]);
    logger.auth("Login successful", {
      user_email: email,
      user_id_from_jwt: userPayload.userId,
      source: "SERVER_API",
      message: null,
    });
    return res
      .status(200)
      .json({
        success: true,
        message: "Login successful",
        accessToken,
        refreshToken,
      });
  } else {
    logger.auth("Login failed: Invalid credentials", {
      user_email: email,
      source: "SERVER_API",
      payload: { providedEmail: email },
      message: null,
    });
    return res
      .status(401)
      .json({ success: false, message: "Invalid email or password" });
  }
}
