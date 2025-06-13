import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose"; // Using jose for edge-compatible JWT verification
// Removed unused logger import
import { getConfigValue } from "@/lib/config";

const JWT_SECRET_STRING = process.env.JWT_SECRET || "";
const JWT_SECRET = JWT_SECRET_STRING
  ? new TextEncoder().encode(JWT_SECRET_STRING)
  : undefined;
const ACCESS_TOKEN_NAME = "accessToken";
const REFRESH_TOKEN_NAME = "refreshToken";
let cachedAdminEmail: string | null = null;

async function verifyToken(token: string) {
  if (!JWT_SECRET) {
    console.error(
      "JWT_SECRET is not defined in middleware. Cannot verify token."
    );
    // Log this critical error to Supabase if logger is edge compatible, or use console.error
    // logger.error('MIDDLEWARE', "JWT_SECRET is not defined", { critical: true });
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as {
      userId: string;
      email: string;
      iat: number;
      exp: number;
    };
  } catch (error) {
    // console.warn("Token verification failed in middleware:", error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  // Enforce HTTPS in production deployments
  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("x-forwarded-proto") !== "https"
  ) {
    const url = request.nextUrl
    url.protocol = "https:"
    return NextResponse.redirect(url, 308)
  }
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  if (!cachedAdminEmail) {
    cachedAdminEmail = (await getConfigValue('admin_email')) || '';
  }

  const publicPaths = [
    "/login",
    "/api/login",
    "/api/refresh",
    "/api/socketio",
    "/api/consent",
    "/api/version",
    "/api/webrtc-config",
    "/api/health",
  ];
  const isAdminPath =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isPublicPath =
    publicPaths.some((path) => pathname.startsWith(path)) || pathname === "/";

  const accessToken = request.cookies.get(ACCESS_TOKEN_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_NAME)?.value;

  if (isPublicPath && !isAdminPath) {
    if ((pathname === "/" || pathname === "/login") && accessToken) {
      const validAccessTokenPayload = await verifyToken(accessToken);
      if (validAccessTokenPayload) {
        return NextResponse.redirect(new URL("/room-entry", request.url));
      }
    }
    return response;
  }

  // Handle admin paths
  if (isAdminPath) {
    if (!accessToken) {
      // logger.auth('Admin path access denied: No access token.', { source: 'MIDDLEWARE', room_id: pathname, user_email: 'anonymous' });
      return NextResponse.redirect(
        new URL(`/login?redirect=${pathname}`, request.url)
      );
    }
    const adminPayload = await verifyToken(accessToken);
    if (!adminPayload) {
      // logger.auth('Admin path access denied: Invalid access token.', { source: 'MIDDLEWARE', room_id: pathname, user_email: 'anonymous (invalid token)' });
      return NextResponse.redirect(
        new URL(`/login?redirect=${pathname}`, request.url)
      );
    }
    if (adminPayload.email !== cachedAdminEmail || !cachedAdminEmail) {
      // logger.auth('Admin path access denied: User not admin.', { source: 'MIDDLEWARE', room_id: pathname, user_email: adminPayload.email });
      // Optionally redirect to a generic 'unauthorized' page or home
      return NextResponse.redirect(new URL("/room-entry", request.url)); // Or an 'unauthorized' page
    }
    // logger.adminAccess('Admin path accessed.', { source: 'MIDDLEWARE', room_id: pathname, user_email: adminPayload.email });
    return response; // Admin access granted
  }

  // Protected non-admin paths
  if (!accessToken) {
    if (refreshToken) {
      try {
        const refreshApiResponse = await fetch(
          new URL("/api/refresh", request.url).toString(),
          {
            method: "POST",
            headers: { cookie: `${REFRESH_TOKEN_NAME}=${refreshToken}` },
          }
        );

        if (refreshApiResponse.ok) {
          const newResponse = NextResponse.redirect(request.url); // Redirect to original URL to retry
          // Forward Set-Cookie headers from the refresh API response
          const setCookieHeader = refreshApiResponse.headers.get("Set-Cookie");
          if (setCookieHeader) {
            // Split cookies if multiple are set (though /api/refresh should only set one)
            setCookieHeader.split(", ").forEach((cookieStr) => {
              const [cookieNameValue] = cookieStr.split(";");
              const [name, value] = cookieNameValue.split("=");
              if (name === ACCESS_TOKEN_NAME) {
                newResponse.cookies.set(name, value, {
                  path: "/",
                  httpOnly: true,
                  secure: process.env.NODE_ENV !== "development",
                  sameSite: "strict",
                });
              }
            });
          }
          // logger.auth('Access token refreshed via middleware.', { source: 'MIDDLEWARE', room_id: pathname });
          return newResponse;
        } else {
          // logger.auth('Refresh token validation failed via middleware.', { source: 'MIDDLEWARE', room_id: pathname, payload: { status: refreshApiResponse.status } });
          // Clear potentially invalid refresh token by redirecting to logout then login
          const loginUrl = new URL("/login", request.url);
          loginUrl.searchParams.set("redirect", pathname);
          const logoutAndRedirect = NextResponse.redirect(loginUrl);
          logoutAndRedirect.cookies.delete({
            name: REFRESH_TOKEN_NAME,
            path: "/",
          });
          logoutAndRedirect.cookies.delete({
            name: ACCESS_TOKEN_NAME,
            path: "/",
          });
          return logoutAndRedirect;
        }
      } catch (e) {
        // console.error("Middleware refresh fetch error:", e);
        // logger.error('MIDDLEWARE', 'Error during token refresh in middleware.', e, { room_id: pathname });
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
    // No access token, no valid refresh token or refresh failed, redirect to login
    // logger.auth('Access denied: No valid tokens.', { source: 'MIDDLEWARE', room_id: pathname, user_email: 'anonymous' });
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyToken(accessToken);
  if (!payload) {
    // This case implies the access token was present but invalid (e.g., tampered, expired and refresh failed or wasn't attempted)
    // The refresh logic above should ideally handle expired tokens.
    // logger.auth('Access denied: Invalid access token (post-refresh check).', { source: 'MIDDLEWARE', room_id: pathname });
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const logoutAndRedirect = NextResponse.redirect(loginUrl);
    logoutAndRedirect.cookies.delete({ name: REFRESH_TOKEN_NAME, path: "/" });
    logoutAndRedirect.cookies.delete({ name: ACCESS_TOKEN_NAME, path: "/" });
    return logoutAndRedirect;
  }

  // Valid access token, allow request
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page itself - handled by isPublicPath)
     * - api/login (login API - handled by isPublicPath)
     * - api/refresh (refresh token API - handled by isPublicPath)
     * - api/socketio (socket.io endpoint - handled by isPublicPath)
     * This ensures middleware runs on protected pages like /call/*, /room-entry, /admin/*
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
// Note: Logging within middleware (especially to an async service like Supabase)
// can add latency. For Vercel Edge Middleware, direct DB calls are not recommended.
// A common pattern is to send logs to an Edge-friendly logging service or a separate API route.
// For simplicity here, logger calls are commented out. Consider implications in production.
// If `logger` uses `fetch` to a separate API route for logging, it could work in Edge.
// But direct Supabase client usage (which might use non-Edge APIs) won't work.
// For now, I'll assume logger calls within middleware would be handled appropriately for the Edge,
// or that this app isn't exclusively deployed to Vercel Edge functions for all middleware paths.
// The current Supabase client is not Edge-safe. For middleware logging, you'd typically:
// 1. Send a fetch request to a regular Next.js API route that then uses the Supabase client.
// 2. Use Vercel Log Drains or a similar Edge-compatible logging service.
// For this exercise, I'm keeping the logger calls commented in middleware to show intent,
// but they would need an Edge-compatible implementation.
