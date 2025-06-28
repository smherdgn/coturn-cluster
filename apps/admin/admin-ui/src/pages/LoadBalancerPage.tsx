import React from "react";
import PageHeader from "../components/layout/PageHeader";
import Spinner from "../components/common/Spinner";
import Card from "../components/common/Card";
import StatusBadge from "../components/common/StatusBadge";
import { useNginxStatus } from "../hooks/apiHooks";

const LoadBalancerPage: React.FC = () => {
  const { data: nginxStatus, isLoading, isError, error } = useNginxStatus();

  if (isLoading) return <Spinner />;
  if (isError)
    return (
      <p className="text-red-500">
        Error fetching Nginx status: {error.message}
      </p>
    );

  const { status, totalRequests, activeConnections, upstreams } =
    nginxStatus || {};

  return (
    <>
      <PageHeader
        title="Nginx Load Balancer"
        subtitle="Monitor Nginx upstream configuration and status"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div
          className={`p-5 rounded-lg text-white ${
            status === "active" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          <p className="font-medium uppercase text-sm">Status</p>
          <p className="text-3xl font-bold">{status || "N/A"}</p>
        </div>
        <div className="p-5 rounded-lg text-white bg-purple-600">
          <p className="font-medium uppercase text-sm">Total Requests</p>
          <p className="text-3xl font-bold">
            {totalRequests?.toLocaleString() ?? "N/A"}
          </p>
        </div>
        <div className="p-5 rounded-lg text-white bg-teal-600">
          <p className="font-medium uppercase text-sm">Active Connections</p>
          <p className="text-3xl font-bold">
            {activeConnections?.toLocaleString() ?? "N/A"}
          </p>
        </div>
      </div>

      <Card title="Upstream Servers">
        <div className="space-y-6">
          {upstreams && upstreams.length > 0 ? (
            upstreams.map((upstream) => (
              <div key={upstream.name}>
                <h3 className="font-semibold text-slate-800 mb-2">
                  {upstream.name}
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="th-cell">Address</th>
                        <th className="th-cell">Status</th>
                        <th className="th-cell">Requests</th>
                        <th className="th-cell">Responses (2xx/4xx/5xx)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {upstream.servers.map((server) => (
                        <tr key={server.address}>
                          <td className="td-cell">{server.address}</td>
                          <td className="td-cell">
                            <StatusBadge status={server.status} />
                          </td>
                          <td className="td-cell">
                            {server.requests?.toLocaleString()}
                          </td>
                          <td className="td-cell">
                            <span className="text-green-600">
                              {server.responses["2xx"] || 0}
                            </span>{" "}
                            /
                            <span className="text-yellow-600">
                              {server.responses["4xx"] || 0}
                            </span>{" "}
                            /
                            <span className="text-red-600">
                              {server.responses["5xx"] || 0}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-500">No upstream servers configured.</p>
          )}
        </div>
      </Card>
    </>
  );
};

export default LoadBalancerPage;
