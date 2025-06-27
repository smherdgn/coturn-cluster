import React from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";
import Spinner from "../components/common/Spinner";
import Card from "../components/common/Card";
import StatusBadge from "../components/common/StatusBadge";
import { useNodes, useDeleteNode, useRestartNode } from "../hooks/apiHooks";

const RedisPage: React.FC = () => {
  const { data: nodes, isLoading, isError, error } = useNodes();
  const deleteNodeMutation = useDeleteNode();
  const restartNodeMutation = useRestartNode();
  // const addNodeMutation = useAddNode(); // Ekleme modalı yapıldığında bu kullanılacak

  // Silme ve yeniden başlatma işlemlerini yöneten handlerlar
  const handleDelete = (nodeId: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete node ${nodeId}? This action cannot be undone.`
      )
    ) {
      // Mutationı tetikle
      deleteNodeMutation.mutate(nodeId);
    }
  };

  const handleRestart = (nodeId: string) => {
    if (window.confirm(`Are you sure you want to restart node ${nodeId}?`)) {
      // Mutationı tetikle
      restartNodeMutation.mutate(nodeId);
    }
  };

  const handleAddNode = () => {
    // Bu kısım modal implementasyonu ile doldurulacak
    // Örn addNodeMutation.mutate({ autoRegisterNginx: true });
    alert("Add Node modal will be implemented here.");
  };

  if (isLoading) return <Spinner />;
  if (isError)
    return (
      <p className="text-red-500">Error fetching nodes: {error.message}</p>
    );

  return (
    <>
      <PageHeader
        title="Node Management"
        subtitle="Manage TURN STUN server nodes"
      />
      <Card>
        <div className="p-5 border-b border-slate-200 flex justify-between items-center -m-5 mb-5">
          <h2 className="text-lg font-semibold text-slate-700">
            Cluster Nodes
          </h2>
          <button
            onClick={handleAddNode}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm"
          >
            ➕ Add Node
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="th-cell">ID</th>
                <th className="th-cell">IP Address</th>
                <th className="th-cell">Ports (T/TLS/A)</th>
                <th className="th-cell">Status</th>
                <th className="th-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {nodes && nodes.length > 0 ? (
                nodes.map((node) => (
                  <tr key={node.nodeId}>
                    <td className="td-cell font-medium">
                      <Link
                        to={`/logs/${node.nodeId}`}
                        className="text-blue-600 hover:underline"
                      >
                        {node.nodeId}
                      </Link>
                    </td>
                    <td className="td-cell text-slate-500">{node.ip}</td>
                    <td className="td-cell text-slate-500">{`${node.ports.turn}/${node.ports.tls}/${node.ports.agent}`}</td>
                    <td className="td-cell">
                      <StatusBadge status={node.status} />
                    </td>
                    <td className="td-cell space-x-2">
                      <button
                        onClick={() => handleRestart(node.nodeId)}
                        disabled={restartNodeMutation.isPending}
                        className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                      >
                        {restartNodeMutation.isPending &&
                        restartNodeMutation.variables === node.nodeId
                          ? "Restarting..."
                          : "Restart"}
                      </button>
                      <button
                        onClick={() => handleDelete(node.nodeId)}
                        disabled={deleteNodeMutation.isPending}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {deleteNodeMutation.isPending &&
                        deleteNodeMutation.variables === node.nodeId
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                      <Link
                        to={`/logs/${node.nodeId}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Logs
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">
                    No nodes found.
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

export default RedisPage;
