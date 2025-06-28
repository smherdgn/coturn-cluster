import React from "react";
import { type Status } from "../../types";

const statusColors: Record<string, string> = {
  healthy: "bg-green-100 text-green-700",
  up: "bg-green-100 text-green-700",
  active: "bg-green-100 text-green-700",
  valid: "bg-green-100 text-green-700",
  enabled: "bg-green-100 text-green-700",
  unhealthy: "bg-red-100 text-red-700",
  down: "bg-red-100 text-red-700",
  error: "bg-red-100 text-red-700",
  unknown: "bg-yellow-100 text-yellow-700",
  degraded: "bg-yellow-100 text-yellow-700",
};

const StatusBadge: React.FC<{ status?: Status }> = ({ status = "unknown" }) => {
  const color =
    statusColors[status.toLowerCase()] || "bg-slate-100 text-slate-700";
  return (
    <span
      className={`px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${color}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
