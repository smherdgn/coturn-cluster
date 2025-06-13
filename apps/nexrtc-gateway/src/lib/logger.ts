import { supabase } from "./supabaseClient";
import type { LogEntry, LogSource } from "@/types";

export interface LogDetails extends Omit<LogEntry, "log_type" | "source"> {
  source?: LogSource;
}

async function insertLog(logEntry: LogEntry): Promise<void> {
  // Ensure required fields for DB are present, others can be null/undefined
  const entryToInsert: Partial<LogEntry> = {
    ...logEntry,
    user_email: logEntry.user_email || null,
    user_id_from_jwt: logEntry.user_id_from_jwt || null,
    socket_id: logEntry.socket_id || null,
    room_id: logEntry.room_id || null,
    payload: logEntry.payload || null,
    peer_socket_id: logEntry.peer_socket_id || null,
    webrtc_ice_state: logEntry.webrtc_ice_state || null,
    webrtc_signaling_state: logEntry.webrtc_signaling_state || null,
  };

  const { error } = await supabase.from("app_logs").insert(entryToInsert);

  if (error) {
    console.error(
      "Failed to insert log into Supabase:",
      error.message,
      entryToInsert
    );
    // Optionally, implement a fallback logging mechanism (e.g., to console or a file)
  } else {
    // console.log('Log inserted:', logEntry.log_type, logEntry.message); // For dev debugging
  }
}

export const logger = {
  info: (source: LogSource, message: string, details?: LogDetails) => {
    insertLog({ log_type: "SYSTEM_INFO", source, message, ...details });
  },
  error: (
    source: LogSource,
    message: string,
    errorDetails?: any,
    details?: LogDetails
  ) => {
    let payload = details?.payload || {};
    if (errorDetails) {
      payload.error = {
        message: errorDetails.message,
        stack: errorDetails.stack,
        name: errorDetails.name,
        ...(typeof errorDetails === "object" &&
          errorDetails !== null &&
          errorDetails),
      };
    }
    insertLog({ log_type: "ERROR", source, message, ...details, payload });
  },
  auth: (message: string, details?: LogDetails) => {
    // Source for auth logs is typically SERVER_API or SERVER_SOCKET or MIDDLEWARE
    const source = details?.source || "SERVER_API";
    insertLog({ log_type: "AUTH", source, message, ...details });
  },
  apiCall: (message: string, details?: LogDetails) => {
    // Source for api calls is SERVER_API
    insertLog({
      log_type: "API_CALL",
      source: "SERVER_API",
      message,
      ...(details ?? {}),
    });
  },
  signaling: (source: LogSource, message: string, details?: LogDetails) => {
    // log_type can be SIGNALING_SERVER or SIGNALING_CLIENT based on source
    const log_type =
      source === "CLIENT_APP" ? "SIGNALING_CLIENT" : "SIGNALING_SERVER";
    insertLog({ log_type, source, message, ...details });
  },
  webrtcEvent: (source: LogSource, message: string, details?: LogDetails) => {
    insertLog({ log_type: "WEBRTC_EVENT", source, message, ...details });
  },
  roomEvent: (source: LogSource, message: string, details?: LogDetails) => {
    insertLog({ log_type: "ROOM_EVENT", source, message, ...details });
  },
  adminAccess: (message: string, details?: LogDetails) => {
    // source could be MIDDLEWARE or SERVER_API (for accessing admin data)
    const source = details?.source || "SERVER_API";
    insertLog({ log_type: "ADMIN_ACCESS", source, message, ...details });
  },
  // Add more specific log functions as needed
};
