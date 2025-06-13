"use client";
import React, { useState, useEffect, useCallback, FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import type { LogEntry, AdminLogFilters, LogType, LogSource } from "@/types";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Loader2,
  ShieldAlert,
  ArrowDownUp,
} from "lucide-react";
import { showToast } from "@/components/ui/Toaster";

const LOG_TYPES: LogType[] = [
  "SIGNALING_SERVER",
  "SIGNALING_CLIENT",
  "AUTH",
  "API_CALL",
  "WEBRTC_EVENT",
  "ROOM_EVENT",
  "ADMIN_ACCESS",
  "SYSTEM_INFO",
  "ERROR",
];
const LOG_SOURCES: LogSource[] = [
  "CLIENT_APP",
  "SERVER_API",
  "SERVER_SOCKET",
  "MIDDLEWARE",
];

export default function AdminDashboardPage() {
  const { user, isAdmin, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(25);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [filters, setFilters] = useState<AdminLogFilters>({});
  const [sortBy, setSortBy] = useState<{
    column: keyof LogEntry | string;
    order: "asc" | "desc";
  }>({ column: "created_at", order: "desc" });

  const fetchLogs = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoadingLogs(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        sort_by: sortBy.column.toString(),
        sort_order: sortBy.order,
        ...filters,
      });
      // Remove empty filter values
      Object.keys(filters).forEach((key) => {
        if (!filters[key as keyof AdminLogFilters]) {
          queryParams.delete(key);
        }
      });

      const response = await fetch(`/api/admin/logs?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch logs");
      }
      const data = await response.json();
      setLogs(data.logs);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
    } catch (error: any) {
      console.error("Error fetching logs:", error);
      showToast(`Error fetching logs: ${error.message}`, "error");
      if (
        error.message.includes("Forbidden") ||
        error.message.includes("Authentication")
      ) {
        logout(); // If token issue or not admin, logout
      }
    } finally {
      setIsLoadingLogs(false);
    }
  }, [isAdmin, currentPage, limit, filters, sortBy, logout]);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace("/room-entry"); // Redirect if not admin
    } else if (isAdmin) {
      fetchLogs();
    }
  }, [authLoading, isAdmin, router, fetchLogs]);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFilterSubmit = (e: FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new filter
    fetchLogs();
  };

  const handleSort = (column: keyof LogEntry | string) => {
    setSortBy((prev) => ({
      column,
      order: prev.column === column && prev.order === "desc" ? "asc" : "desc",
    }));
    setCurrentPage(1);
    // fetchLogs will be triggered by sortBy change in useEffect if it were a dep,
    // but since fetchLogs has sortBy as dep, direct call is also fine or rely on useEffect for sortBy.
    // For explicit control, call fetchLogs. (It's in useEffect's deps, so it will run)
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
        <ShieldAlert size={64} className="text-danger mb-4" />
        <h1 className="text-2xl font-bold text-primary-text mb-2">
          Access Denied
        </h1>
        <p className="text-text-muted">
          You do not have permission to view this page.
        </p>
        <button
          onClick={() => router.push("/room-entry")}
          className="mt-6 py-2 px-4 bg-primary text-primary-text rounded hover:bg-primary-hover"
        >
          Go to Room Entry
        </button>
      </div>
    );
  }

  const renderSortIcon = (column: keyof LogEntry | string) => {
    if (sortBy.column !== column)
      return <ArrowDownUp size={14} className="ml-1 opacity-30" />;
    return sortBy.order === "desc" ? "▼" : "▲";
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-center">
        <h1 className="text-3xl font-bold text-primary-text">
          Admin Log Dashboard
        </h1>
        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          <button
            onClick={() => fetchLogs()}
            disabled={isLoadingLogs}
            className="p-2 bg-secondary text-secondary-text rounded-md hover:bg-secondary-hover disabled:opacity-50"
            title="Refresh Logs"
          >
            {isLoadingLogs ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <RefreshCw size={20} />
            )}
          </button>
          <span className="text-sm text-text-muted">User: {user?.email}</span>
        </div>
      </header>

      {/* Filters Section */}
      <form
        onSubmit={handleFilterSubmit}
        className="mb-6 p-4 bg-card rounded-lg shadow-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end"
      >
        <input
          type="text"
          name="user_email"
          value={filters.user_email || ""}
          onChange={handleFilterChange}
          placeholder="User Email"
          className="input-style"
        />
        <input
          type="text"
          name="room_id"
          value={filters.room_id || ""}
          onChange={handleFilterChange}
          placeholder="Room ID"
          className="input-style"
        />
        <select
          name="log_type"
          value={filters.log_type || ""}
          onChange={handleFilterChange}
          className="input-style"
        >
          <option value="">All Log Types</option>
          {LOG_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <select
          name="source"
          value={filters.source || ""}
          onChange={handleFilterChange}
          className="input-style"
        >
          <option value="">All Sources</option>
          {LOG_SOURCES.map((src) => (
            <option key={src} value={src}>
              {src}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="date_from"
          value={filters.date_from || ""}
          onChange={handleFilterChange}
          className="input-style"
        />
        <input
          type="date"
          name="date_to"
          value={filters.date_to || ""}
          onChange={handleFilterChange}
          className="input-style"
        />
        <input
          type="text"
          name="search_term"
          value={filters.search_term || ""}
          onChange={handleFilterChange}
          placeholder="Search Message/Payload"
          className="input-style sm:col-span-2 lg:col-span-1"
        />
        <button
          type="submit"
          className="flex items-center justify-center py-2 px-4 bg-primary text-primary-text rounded-md hover:bg-primary-hover h-10"
        >
          <Filter size={18} className="mr-2" /> Apply Filters
        </button>
      </form>

      {/* Logs Table */}
      <div className="overflow-x-auto bg-card rounded-lg shadow">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-gray-800">
            <tr>
              <th
                onClick={() => handleSort("created_at")}
                className="th-style cursor-pointer"
              >
                Timestamp {renderSortIcon("created_at")}
              </th>
              <th
                onClick={() => handleSort("log_type")}
                className="th-style cursor-pointer"
              >
                Type {renderSortIcon("log_type")}
              </th>
              <th
                onClick={() => handleSort("source")}
                className="th-style cursor-pointer"
              >
                Source {renderSortIcon("source")}
              </th>
              <th
                onClick={() => handleSort("user_email")}
                className="th-style cursor-pointer"
              >
                User {renderSortIcon("user_email")}
              </th>
              <th className="th-style">Room</th>
              <th className="th-style">Socket ID</th>
              <th className="th-style">Message</th>
              <th className="th-style">Payload</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoadingLogs && (
              <tr>
                <td colSpan={8} className="text-center py-10">
                  <Loader2
                    className="animate-spin text-primary mx-auto"
                    size={32}
                  />
                </td>
              </tr>
            )}
            {!isLoadingLogs && logs.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-text-muted">
                  No logs found.
                </td>
              </tr>
            )}
            {!isLoadingLogs &&
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-gray-700 transition-colors"
                >
                  <td className="td-style whitespace-nowrap">
                    {new Date(log.created_at || "").toLocaleString()}
                  </td>
                  <td className="td-style">{log.log_type}</td>
                  <td className="td-style">{log.source}</td>
                  <td className="td-style">{log.user_email || "-"}</td>
                  <td className="td-style">{log.room_id || "-"}</td>
                  <td className="td-style">
                    {log.socket_id
                      ? log.socket_id.substring(0, 8) + "..."
                      : "-"}
                  </td>
                  <td
                    className="td-style max-w-xs truncate"
                    title={log.message ?? undefined}
                  >
                    {log.message}
                  </td>
                  <td className="td-style">
                    {log.payload && (
                      <details>
                        <summary className="cursor-pointer text-blue-400 hover:underline">
                          View
                        </summary>
                        <pre className="mt-1 text-xs bg-gray-800 p-2 rounded max-h-40 overflow-auto whitespace-pre-wrap break-all">
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                      </details>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex flex-col sm:flex-row justify-between items-center text-sm">
        <div className="mb-2 sm:mb-0">
          Showing {logs.length > 0 ? (currentPage - 1) * limit + 1 : 0}-
          {Math.min(currentPage * limit, totalCount)} of {totalCount} logs.
        </div>
        <div className="flex items-center space-x-2">
          <span className="mr-2">Rows per page:</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(parseInt(e.target.value));
              setCurrentPage(1);
            }}
            className="input-style !py-1 !px-2 w-auto"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1 || isLoadingLogs}
            className="pagination-button"
          >
            <ChevronLeft size={18} /> Prev
          </button>
          <span className="px-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={
              currentPage === totalPages || totalPages === 0 || isLoadingLogs
            }
            className="pagination-button"
          >
            Next <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <style jsx>{`
        .input-style {
          @apply block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-text;
        }
        .th-style {
          @apply px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider;
        }
        .td-style {
          @apply px-4 py-3 text-sm text-gray-300;
        }
        .pagination-button {
          @apply flex items-center py-1.5 px-3 bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
        }
      `}</style>
    </div>
  );
}
