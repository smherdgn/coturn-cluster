import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";
import Spinner from "../components/common/Spinner";
import Card from "../components/common/Card";

import { useNodes, useNodeLogs } from "../hooks/apiHooks";

const LogsPage: React.FC = () => {
  const { nodeId } = useParams<{ nodeId: string }>();
  const navigate = useNavigate();

  const { data: nodes, isLoading: isLoadingNodes } = useNodes();
  const { data: logs, isLoading: isLoadingLogs } = useNodeLogs(nodeId);

  const handleNodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedNodeId = e.target.value;
    navigate(selectedNodeId ? `/logs/${selectedNodeId}` : "/logs");
  };

  return (
    <>
      <PageHeader
        title="System Logs"
        subtitle="Real-time log monitoring for cluster nodes"
      />
      <Card>
        <div className="p-5 border-b border-slate-200 flex justify-between items-center -m-5 mb-5">
          <h2 className="text-lg font-semibold text-slate-700">Log Viewer</h2>
          <div className="w-64">
            {/* Node listesi yüklenirken select'i devre dışı bırakabiliriz */}
            {isLoadingNodes ? (
              <Spinner />
            ) : (
              <select
                value={nodeId || ""}
                onChange={handleNodeChange}
                className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select a Node</option>
                {nodes?.map((node) => (
                  <option key={node.nodeId} value={node.nodeId}>
                    {node.nodeId} ({node.ip})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        <div className="log-viewer bg-slate-900 text-slate-200 p-4 rounded-md h-96 overflow-y-auto text-xs">
          {/* Sadece loglar yüklenirken spinner göster */}
          {isLoadingLogs ? (
            <Spinner />
          ) : (
            <pre>{logs || "Please select a node to view logs."}</pre>
          )}
        </div>
      </Card>
    </>
  );
};

export default LogsPage;
