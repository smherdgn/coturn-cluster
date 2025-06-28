import React from "react";
import PageHeader from "../components/layout/PageHeader";
import Spinner from "../components/common/Spinner";
import Card from "../components/common/Card";
import StatusBadge from "../components/common/StatusBadge";
import { useServices } from "../hooks/apiHooks";

const ServicesPage: React.FC = () => {
  const { data: services, isLoading, isError, error } = useServices();

  if (isLoading) return <Spinner />;
  if (isError)
    return (
      <p className="text-red-500">Error fetching services: {error.message}</p>
    );

  return (
    <>
      <PageHeader
        title="Service Registry"
        subtitle="Manage and monitor registered services"
      />
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="th-cell">Service ID</th>
                <th className="th-cell">Endpoint</th>
                <th className="th-cell">Status</th>
                <th className="th-cell">Node ID</th>
                <th className="th-cell">Version</th>
                <th className="th-cell">Last Heartbeat</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {services && services.length > 0 ? (
                services.map((service) => (
                  <tr key={service.serviceId}>
                    <td className="td-cell font-medium">{service.serviceId}</td>
                    <td className="td-cell text-slate-500">
                      {service.host}:{service.port}
                    </td>
                    <td className="td-cell">
                      <StatusBadge status={service.status} />
                    </td>
                    <td className="td-cell text-slate-500">
                      {service.metadata.nodeId}
                    </td>
                    <td className="td-cell text-slate-500">
                      {service.metadata.version || "N/A"}
                    </td>
                    <td className="td-cell text-slate-500">
                      {service.metadata.lastHeartbeat
                        ? new Date(
                            service.metadata.lastHeartbeat
                          ).toLocaleString()
                        : "N/A"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    No services registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
};

export default ServicesPage;
