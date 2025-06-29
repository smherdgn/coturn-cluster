import React from "react";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/common/Card";
import StatusBadge from "../components/common/StatusBadge";
import { useDatabaseStatus } from "../hooks/apiHooks";
import Spinner from "../components/common/Spinner";

// mock database information
const dbInfo = {
  type: "PostgreSQL",
  host: "postgres.coturn.local",
  port: 5432,
  status: "healthy" as const,
  version: "15.3",
  activeConnections: 37,
  avgQueryTimeMs: 12,
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

const DatabasePage: React.FC = () => {
  const { data, isLoading } = useDatabaseStatus();

  if (isLoading) return <Spinner />;
  // if (isError) return <p className="text-red-500">Error: {error.message}</p>;

  return (
    <>
      <PageHeader
        title="🗄️ Database Management"
        subtitle="PostgreSQL cluster configuration and health monitoring"
      />

      <div>
        <h1 className="text-2xl text-slate-700 font-bold mb-4">
          Database Status
        </h1>
        <pre className="text-slate-500 p-4 rounded">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Connection Details">
          <InfoRow label="Database Type">{dbInfo.type}</InfoRow>
          <InfoRow label="Host">{dbInfo.host}</InfoRow>
          <InfoRow label="Port">{data?.provider}</InfoRow>
          <InfoRow label="Version">{data?.version}</InfoRow>
        </Card>
        <Card title="Health & Performance">
          <InfoRow label="Connection Status">
            <StatusBadge status={dbInfo.status} />
          </InfoRow>
          <InfoRow label="Active Connections">
            {dbInfo.activeConnections}
          </InfoRow>
          <InfoRow label="Average Query Time">
            {dbInfo.avgQueryTimeMs} ms
          </InfoRow>
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Database Actions">
          <p className="text-sm text-slate-500 mb-4">
            Advanced database operations should be performed with caution.
          </p>
          <div className="flex space-x-2">
            <button className="btn-secondary">Run Migrations</button>
            <button className="btn-secondary">Backup Database</button>
            <button className="btn-danger">Clear Cache</button>
          </div>
        </Card>
      </div>
    </>
  );
};

export default DatabasePage;
