// Real Node Management
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class NodeManager {
private static instance: NodeManager;
private usedIPs = new Set<string>();
private usedPorts = new Set<number>();

static getInstance(): NodeManager {
if (!NodeManager.instance) {
NodeManager.instance = new NodeManager();
}
return NodeManager.instance;
}

generateUniqueIP(): string {
const baseIP = '192.168.1.';

for (let i = 10; i < 255; i++) {
const testIP = baseIP + i;
if (!this.usedIPs.has(testIP)) {
this.usedIPs.add(testIP);
return testIP;
}
}

// Fallback to random
const randomSuffix = Math.floor(Math.random() * 245) + 10;
return baseIP + randomSuffix;
}

generateUniquePorts(): { agent: number; turn: number; tls: number } {
const findNextPort = (basePort: number): number => {
for (let i = 0; i < 100; i++) {
const testPort = basePort + i;
if (!this.usedPorts.has(testPort)) {
this.usedPorts.add(testPort);
return testPort;
}
}
return basePort;
};

return {
agent: findNextPort(8100),
turn: findNextPort(3478),
tls: findNextPort(5349)
};
}

async startNewNode(ip: string, ports: any, autoRegisterNginx: boolean): Promise<string> {
const nodeId = `${ip}-${Date.now().toString(36)}`;

try {
// Create docker container for new node
const dockerCommand = `
docker run -d \\
--name coturn-node-${nodeId} \\
--network coturn-cluster_coturn-net \\
-p ${ports.turn}:${ports.turn}/udp \\
-p ${ports.tls}:${ports.tls}/tcp \\
-p ${ports.agent}:${ports.agent} \\
-e NODE_ID=${nodeId} \\
-e ADMIN_PUBSUB_URL=ws://admin:9000 \\
-e COTURN_AGENT_PORT=${ports.agent} \\
-e COTURN_PORT=${ports.turn} \\
-e COTURN_TLS_PORT=${ports.tls} \\
coturn-cluster_coturn-node
`;

await execAsync(dockerCommand);

// Update nginx if requested
if (autoRegisterNginx) {
await this.updateNginxConfig(ip, ports.turn);
}

return nodeId;
} catch (error) {
throw new Error(`Failed to start node: ${error}`);
}
}

async updateNginxConfig(ip: string, port: number): Promise<void> {
// Add server to nginx upstream
const nginxCommand = `
docker exec coturn-cluster_nginx \\
sh -c 'echo " server ${ip}:${port} weight=1 max_fails=3 fail_timeout=30s;" >> /etc/nginx/conf.d/default.conf && nginx -s reload'
`;

try {
await execAsync(nginxCommand);
console.log(`🔧 Added ${ip}:${port} to nginx upstream`);
} catch (error) {
console.error(`❌ Failed to update nginx: ${error}`);
}
}

async removeNode(nodeId: string): Promise<void> {
try {
// Stop and remove docker container
await execAsync(`docker stop coturn-node-${nodeId}`);
await execAsync(`docker rm coturn-node-${nodeId}`);

console.log(`🗑️ Removed node ${nodeId}`);
} catch (error) {
throw new Error(`Failed to remove node: ${error}`);
}
}
}
