import { PubSubBroker } from "../../pubsub/broker";
import * as k8s from "../services/k8s.service";
import * as network from "../services/network.service";
import { createCoturnDeploymentYaml } from "../templates/coturn-deployment.template";

export const listNodes = (broker: PubSubBroker) => {
  return broker.getConnectedNodes();
};

export const createNode = async (broker: PubSubBroker, body: any) => {
  const { ip, ports, autoRegisterNginx } = body;
  const finalIP = ip || network.generateUniqueIP(broker);
  const finalPorts = ports || network.generateUniquePorts(broker);
  const nodeId = `${finalIP.split(".").pop()}-${Date.now().toString(36)}`;

  const yaml = createCoturnDeploymentYaml({
    nodeId,
    ip: finalIP,
    ports: finalPorts,
  });
  await k8s.applyYaml(yaml);

  if (autoRegisterNginx) {
    console.log(`🔧 Nginx will be updated for: ${finalIP}:${finalPorts.turn}`);
  }

  return {
    success: true,
    nodeId,
    ip: finalIP,
    ports: finalPorts,
    message: "Kubernetes node deployment created",
  };
};

export const deleteNode = async (nodeId: string) => {
  await k8s.deleteDeployment(`coturn-${nodeId}`);
  return { success: true, message: "Node deleted" };
};

export const restartNode = async (nodeId: string) => {
  await k8s.restartDeployment(`coturn-${nodeId}`);
  return { success: true, message: "Node restarted" };
};

export const getNodeLogs = async (nodeId: string) => {
  return k8s.getPodLogs(nodeId);
};
