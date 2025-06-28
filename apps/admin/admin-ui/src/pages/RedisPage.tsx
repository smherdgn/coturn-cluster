import React from "react";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/common/Card";
import StatusBadge from "../components/common/StatusBadge";

// mock Redis cache information
const redisInfo = {
  host: "redis.coturn.local",
  port: 6379,
  status: "healthy" as const,
  version: "7.0",
  memoryUsage: "128.45 MB",
  maxMemory: "512 MB",
  cacheHitRate: "98.7%",
};

const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="flex justify-between items-center py-3 border-b border-slate-200 last:border-b-0">
    <span className="text-sm text-slate-600">{label}</span>
    <span className="text-sm font-medium text-slate-800">{children}</span>
  </div>
);

const RedisPage: React.FC = () => {
  return (
    <>
      <PageHeader
        title="📦 Redis Cache"
        subtitle="Redis cache management and performance metrics"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Connection Details">
          <InfoRow label="Host">{redisInfo.host}</InfoRow>
          <InfoRow label="Port">{redisInfo.port}</InfoRow>
          <InfoRow label="Version">{redisInfo.version}</InfoRow>
        </Card>
        <Card title="Health & Performance">
          <InfoRow label="Connection Status">
            <StatusBadge status={redisInfo.status} />
          </InfoRow>
          <InfoRow label="Memory Usage">
            {redisInfo.memoryUsage} / {redisInfo.maxMemory}
          </InfoRow>
          <InfoRow label="Cache Hit Rate">{redisInfo.cacheHitRate}</InfoRow>
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Cache Actions">
          <p className="text-sm text-slate-500 mb-4">
            Flushing the cache will log out all users and clear all session
            data.
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() =>
                window.confirm(
                  "Are you sure you want to flush the entire Redis cache?"
                )
              }
              className="btn-danger"
            >
              Flush All Cache
            </button>
          </div>
        </Card>
      </div>
    </>
  );
};

export default RedisPage;
