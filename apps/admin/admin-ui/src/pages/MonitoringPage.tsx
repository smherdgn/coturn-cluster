import React from "react";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/common/Card";

const grafanaUrl = import.meta.env.VITE_GRAFANA_URL || "#";

const MonitoringPage: React.FC = () => {
  return (
    <>
      <PageHeader
        title="Monitoring"
        subtitle="Links and information for integrated monitoring tools like Prometheus and Grafana."
      />

      <div className="space-y-6">
        <Card>
          <p className="mb-4 text-slate-600">
            You can access the detailed performance metrics and system health
            dashboards via Grafana.
          </p>
          <a
            href={grafanaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm"
          >
            Open Grafana Dashboard →
          </a>
        </Card>

        <Card title="Embedded Dashboard (Placeholder)">
          <div className="mt-4 h-96 bg-slate-200 rounded-md flex items-center justify-center border-2 border-dashed border-slate-300">
            <p className="text-slate-500">
              A live Grafana panel could be embedded here using an iframe.
            </p>
          </div>
        </Card>
      </div>
    </>
  );
};

export default MonitoringPage;
