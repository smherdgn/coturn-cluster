import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";
import { ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME } from "@/lib/authUtils";
import { logger } from "@/lib/logger";
import jwt from "jsonwebtoken"; // To decode token for user info if needed
import { JWT_SECRET } from "@/lib/authUtils";
import type { User } from "@/types";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    logger.apiCall("Logout attempt with wrong method", {
      payload: { method: req.method },
      source: "SERVER_API",
      message: "Logout attempt with wrong method",
    });
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  let userEmail: string | undefined = undefined;
  let userIdFromJwt: string | undefined = undefined;
  const token = req.cookies[ACCESS_TOKEN_NAME];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as User & {
        iat: number;
        exp: number;
      };
      userEmail = decoded.email;
      userIdFromJwt = decoded.userId;
    } catch (e) {
      // Token might be expired or invalid, log that if necessary
      logger.auth("Logout with invalid/expired token.", {
        source: "SERVER_API",
        payload: { error: (e as Error).message },
        message: null,
      });
    }
  }

  const accessTokenCookie = serialize(ACCESS_TOKEN_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
    expires: new Date(0),
    path: "/",
  });

  const refreshTokenCookie = serialize(REFRESH_TOKEN_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
    expires: new Date(0),
    path: "/",
  });

  res.setHeader("Set-Cookie", [accessTokenCookie, refreshTokenCookie]);
  logger.auth("Logout successful.", {
    user_email: userEmail,
    user_id_from_jwt: userIdFromJwt,
    source: "SERVER_API",
    message: null,
  });
  return res.status(200).json({ success: true, message: "Logout successful" });
}
