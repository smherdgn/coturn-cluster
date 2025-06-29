import { PubSubBroker } from "../../pubsub/broker";
import { ConnectedNode } from "@coturn-cluster/shared/src/types";

export const generateUniqueIP = (broker: PubSubBroker): string => {
  const usedIPs = broker.getConnectedNodes().map((n) => n.ip);
  const baseIP = "192.168.1.";
  for (let i = 10; i < 255; i++) {
    const testIP = baseIP + i;
    if (!usedIPs.includes(testIP)) return testIP;
  }
  return `192.168.1.${Math.floor(Math.random() * 245) + 10}`;
};

export const generateUniquePorts = (
  broker: PubSubBroker
): { agent: number; turn: number; tls: number } => {
  const usedPorts = broker
    .getConnectedNodes()
    .reduce((ports: number[], node: any) => {
      const connectedNode = node as ConnectedNode;
      return [
        ...ports,
        connectedNode.ports.agent,
        connectedNode.ports.turn,
        connectedNode.ports.tls,
      ];
    }, []);

  const findNextPort = (basePort: number): number => {
    for (let i = 0; i < 100; i++) {
      const testPort = basePort + i;
      if (!usedPorts.includes(testPort)) return testPort;
    }
    return basePort;
  };

  return {
    agent: findNextPort(8100),
    turn: findNextPort(3478),
    tls: findNextPort(5349),
  };
};
