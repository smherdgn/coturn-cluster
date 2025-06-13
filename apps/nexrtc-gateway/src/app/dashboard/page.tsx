"use client";
import React, { useEffect, useState, useCallback } from "react";
import type { UserSession } from "@/lib/sessionManager";

export default function SessionsDashboardPage() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      } else {
        console.error("Failed to fetch sessions", await res.text());
      }
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  const getStatusClass = (status: UserSession["status"]) => {
    switch (status) {
      case "in-call":
        return "text-green-400";
      case "signaling":
        return "text-yellow-400";
      case "connected":
        return "text-blue-400";
      default:
        return "text-text-muted";
    }
  };

  return (
    <div className="min-h-screen bg-background text-text p-4 space-y-4">
      <h1 className="text-2xl font-bold text-primary-text">Active Sessions</h1>
      <div className="overflow-x-auto bg-card rounded-lg border border-border">
        <table className="min-w-full divide-y divide-border">
          <thead>
            <tr className="bg-gray-800 text-left text-sm text-gray-300">
              <th className="px-4 py-2">User ID</th>
              <th className="px-4 py-2">Room ID</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Joined At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {loading ? (
              <tr>
                <td colSpan={4} className="p-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : sessions.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center">
                  No active sessions.
                </td>
              </tr>
            ) : (
              sessions.map((session) => (
                <tr key={session.userId} className="hover:bg-gray-700">
                  <td className="px-4 py-2 whitespace-nowrap">
                    {session.userId}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {session.roomId}
                  </td>
                  <td className={`px-4 py-2 ${getStatusClass(session.status)}`}>
                    {session.status}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {new Date(session.joinedAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
