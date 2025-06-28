import React from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";
import Spinner from "../components/common/Spinner";
import Card from "../components/common/Card";
import StatusBadge from "../components/common/StatusBadge";
import { useNodes, useServices, useDebugInfo } from "../hooks/apiHooks";
import { AppRoute } from "../routes/routes";

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: string;
  color: string;
  to: string;
}> = ({ title, value, icon, color, to }) => (
  <Link
    to={to}
    className={`block text-white p-5 rounded-lg shadow ${color} hover:opacity-90 transition-opacity`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium opacity-80 uppercase tracking-wider">
          {title}
        </p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
      <div className="text-4xl opacity-70">{icon}</div>
    </div>
  </Link>
);

const OverviewPage: React.FC = () => {
  const { data: debugInfo, isLoading: isLoadingDebug } = useDebugInfo();
  const { data: nodes, isLoading: isLoadingNodes } = useNodes();
  const { data: services, isLoading: isLoadingServices } = useServices();

  if (isLoadingDebug || isLoadingNodes || isLoadingServices) {
    return <Spinner />;
  }

  return (
    <>
      <PageHeader
        title="Cluster Overview"
        subtitle="Real-time status and performance metrics"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Nodes"
          value={debugInfo?.totalNodes ?? "N/A"}
          icon="🖥️"
          color="bg-blue-600"
          to={AppRoute.NODES}
        />
        <StatCard
          title="Total Clients"
          value={debugInfo?.totalClients ?? "N/A"}
          icon="👥"
          color="bg-indigo-600"
          to={AppRoute.USERS}
        />
        <StatCard
          title="Active Services"
          value={services?.length ?? "N/A"}
          icon="🔧"
          color="bg-sky-600"
          to={AppRoute.SERVICES}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Connected Nodes">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {nodes && nodes.length > 0 ? (
              nodes.slice(0, 5).map((node) => (
                <div
                  key={node.nodeId}
                  className="flex justify-between items-center p-3 bg-slate-50 rounded-md"
                >
                  <div>
                    <Link
                      to={AppRoute.LOGS_DETAIL(node.nodeId)}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {node.nodeId}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {node.ip}:{node.ports.turn}
                    </p>
                  </div>
                  <StatusBadge status={node.status} />
                </div>
              ))
            ) : (
              <p className="text-slate-500">No nodes connected.</p>
            )}
            {nodes && nodes.length > 5 && (
              <Link
                to={AppRoute.NODES}
                className="text-center block text-sm text-blue-600 mt-2 hover:underline"
              >
                View all {nodes.length} nodes...
              </Link>
            )}
          </div>
        </Card>
        <Card title="Active Services">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {services && services.length > 0 ? (
              services.slice(0, 5).map((service) => (
                <div
                  key={service.serviceId}
                  className="flex justify-between items-center p-3 bg-slate-50 rounded-md"
                >
                  <div>
                    <p className="font-medium text-slate-700">
                      {service.serviceId}
                    </p>
                    <p className="text-xs text-slate-500">
                      {service.host}:{service.port}
                    </p>
                  </div>
                  <StatusBadge status={service.status} />
                </div>
              ))
            ) : (
              <p className="text-slate-500">No services registered.</p>
            )}
            {services && services.length > 5 && (
              <Link
                to={AppRoute.SERVICES}
                className="text-center block text-sm text-blue-600 mt-2 hover:underline"
              >
                View all {services.length} services...
              </Link>
            )}
          </div>
        </Card>
        <Card title="System Health">
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-slate-600">Overall Status:</span>
              <StatusBadge
                status={
                  debugInfo?.nodeStatuses?.every((n) => n.status === "healthy")
                    ? "Healthy"
                    : "Degraded"
                }
              />
            </div>
            {debugInfo && debugInfo.nodeStatuses?.length > 0 && (
              <ul className="space-y-1 text-sm pt-2">
                {debugInfo.nodeStatuses.map((ns) => (
                  <li key={ns.nodeId} className="flex justify-between">
                    <span className="text-slate-500">{ns.nodeId}:</span>
                    <StatusBadge status={ns.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </>
  );
};

export default OverviewPage;
