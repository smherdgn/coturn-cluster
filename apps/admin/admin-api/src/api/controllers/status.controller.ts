import { PubSubBroker } from "../../pubsub/broker";

export const getHealthStatus = (broker: PubSubBroker) => {
  return {
    status: "healthy",
    timestamp: new Date().toISOString(),
    pubsub: broker.getClientStats(),
  };
};

export const getDebugInfo = (broker: PubSubBroker) => {
  return broker.debugInfo();
};

export const getServices = (broker: PubSubBroker) => {
  const nodes = broker.getConnectedNodes();
  return nodes.map((node) => ({
    serviceId: `coturn-node-${node.nodeId}`,
    host: node.ip,
    port: node.ports.turn,
    status: node.status,
    metadata: {
      nodeId: node.nodeId,
      capabilities: node.capabilities,
      version: node.version,
      agentVersion: node.agentVersion,
      lastHeartbeat: node.lastHeartbeat,
    },
  }));
};

export const getK8sDashboardUrl = () => {
  // TODO(Soner): This URL should be configurable or fetched from a config service
  return {
    url: "http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/",
  };
};
