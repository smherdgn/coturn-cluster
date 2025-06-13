import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";
import { logger } from "@/lib/logger";
import type { LogEntry } from "@/types";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@/lib/authUtils"; // Assuming JWT_SECRET is exported from authUtils
import type { User } from "@/types";
import { getConfigValue } from "@/lib/config";

let cachedAdminEmail: string | null = null;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  if (!cachedAdminEmail) {
    cachedAdminEmail = (await getConfigValue('admin_email')) || '';
  }

  // Verify admin
  const token = req.cookies.accessToken;
  if (!token) {
    logger.adminAccess("Admin logs access denied: No token", {
      source: "SERVER_API",
      message: null,
    });
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as User & {
      iat: number;
      exp: number;
    };
    if (decoded.email !== cachedAdminEmail || !cachedAdminEmail) {
      logger.adminAccess("Admin logs access denied: Not admin", {
        user_email: decoded.email,
        user_id_from_jwt: decoded.userId,
        source: "SERVER_API",
        message: null,
      });
      return res
        .status(403)
        .json({ message: "Forbidden: Admin access required" });
    }

    // Admin verified, proceed to fetch logs
    logger.adminAccess("Admin logs accessed", {
      user_email: decoded.email,
      user_id_from_jwt: decoded.userId,
      source: "SERVER_API",
      message: null,
    });

    const {
      page = "1",
      limit = "25",
      log_type,
      user_email,
      room_id,
      source,
      date_from,
      date_to,
      search_term,
      sort_by = "created_at",
      sort_order = "desc",
    } = req.query as { [key: string]: string };

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase.from("app_logs").select("*", { count: "exact" });

    // Apply filters
    if (log_type) query = query.eq("log_type", log_type);
    if (user_email) query = query.ilike("user_email", `%${user_email}%`);
    if (room_id) query = query.ilike("room_id", `%${room_id}%`);
    if (source) query = query.eq("source", source);
    if (date_from) query = query.gte("created_at", date_from);
    if (date_to) query = query.lte("created_at", date_to);
    if (search_term)
      query = query.or(
        `message.ilike.%${search_term}%,payload->>error->>message.ilike.%${search_term}%`
      );

    // Apply sorting
    if (
      sort_by &&
      ["created_at", "log_type", "user_email", "source"].includes(sort_by)
    ) {
      query = query.order(sort_by, { ascending: sort_order === "asc" });
    } else {
      query = query.order("created_at", { ascending: false }); // Default sort
    }

    // Apply pagination
    query = query.range(offset, offset + limitNum - 1);

    const { data, error, count } = await query;

    if (error) {
      logger.error("SERVER_API", "Error fetching logs from Supabase", error, {
        user_email: decoded.email,
        user_id_from_jwt: decoded.userId,
        message: null,
      });
      return res
        .status(500)
        .json({ message: "Failed to fetch logs", error: error.message });
    }

    return res.status(200).json({
      logs: data as LogEntry[],
      totalCount: count || 0,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((count || 0) / limitNum),
    });
  } catch (err) {
    logger.adminAccess("Admin logs access denied: Token verification failed", {
      source: "SERVER_API",
      payload: { error: (err as Error).message },
      message: null,
    });
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
