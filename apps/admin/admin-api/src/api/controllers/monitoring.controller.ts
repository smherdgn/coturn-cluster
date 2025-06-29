import { PubSubBroker } from "../../pubsub/broker";

export const getNginxStatus = (broker: PubSubBroker) => {
  // TODO(Soner): Orginal data add
  const nodes = broker.getConnectedNodes();
  const upstreams = nodes.map((node) => ({
    name: `coturn-${node.nodeId}`,
    servers: [
      {
        address: `${node.ip}:${node.ports.turn}`,
        status: node.status === "healthy" ? "up" : "down",
        weight: 1,
        requests: Math.floor(Math.random() * 1000) + 100,
        responses: {
          "2xx": Math.floor(Math.random() * 900) + 80,
          "4xx": Math.floor(Math.random() * 10),
          "5xx": Math.floor(Math.random() * 5),
        },
      },
    ],
  }));

  return {
    status: "active",
    totalRequests: 12547,
    activeConnections: 234,
    upstreams,
  };
};

export const getSecurityStatus = () => {
  // TODO(Soner): Orginal data add
  return {
    sslCertificates: [
      { domain: "*.coturn.local", status: "valid", expiresIn: "89 days" },
      { domain: "admin.coturn.local", status: "valid", expiresIn: "89 days" },
    ],
    firewall: { status: "active", rules: 15 },
    authentication: { type: "JWT", status: "enabled" },
    encryption: { status: "enabled", algorithm: "AES-256" },
  };
};
