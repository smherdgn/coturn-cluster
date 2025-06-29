export interface DeploymentParams {
  nodeId: string;
  ip: string;
  ports: {
    agent: number;
    turn: number;
    tls: number;
  };
}

export const createCoturnDeploymentYaml = ({
  nodeId,
  ports,
}: DeploymentParams): string => `
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: coturn-${nodeId}
    labels:
      app: coturn-node
      node-id: ${nodeId}
  spec:
    replicas: 1
    selector:
      matchLabels:
        app: coturn-node
        node-id: ${nodeId}
    template:
      metadata:
        labels:
          app: coturn-node
          node-id: ${nodeId}
      spec:
        containers:
          - name: coturn
            image: coturn-cluster_coturn-node # Bu imaj adını kendi projenize göre güncelleyin
            tty: true
            stdin: true
            env:
              - name: NODE_ID
                value: "${nodeId}"
              - name: COTURN_AGENT_PORT
                value: "${ports.agent}"
              - name: COTURN_PORT
                value: "${ports.turn}"
              - name: COTURN_TLS_PORT
                value: "${ports.tls}"
              - name: ADMIN_PUBSUB_URL
                value: "ws://admin-api:9000" # Servis adını kullanmak daha iyidir
            ports:
              - containerPort: ${ports.turn}
  `;
