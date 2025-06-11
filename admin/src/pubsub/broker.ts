// admin/src/pubsub/broker.ts
import { WebSocket, WebSocketServer } from 'ws';
import { generateId, createBaseMessage, parseMessage, stringifyMessage, validateMessage } from "@coturn-cluster/shared";

interface Client {
    id: string;
    ws: WebSocket;
    type: 'admin' | 'node';
    nodeId?: string;
    subscribedChannels: Set<string>;
    connectedAt: Date;
    lastHeartbeat: Date;
}

interface NodeInfo {
    nodeId: string;
    clientId: string;
    ip: string;
    ports: any;
    capabilities?: any;
    version?: string;
    agentVersion?: string;
    status: string;
    connectedAt: Date;
    lastHeartbeat: Date;
    stats?: any;
}

export class PubSubBroker {
    private server: WebSocketServer;
    private clients = new Map<string, Client>();
    private channels = new Map<string, Set<string>>();
    private nodeRegistry = new Map<string, NodeInfo>();
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private port: number;

    constructor(port = 9000) {
        this.port = port;
        this.server = new WebSocketServer({ port });
        this.setupServer();
        this.startHeartbeatMonitor();
    }

    private setupServer() {
        this.server.on('connection', (ws, request) => {
            const clientId = generateId();
            console.log(`🔗 New WebSocket connection: ${clientId}`);

            const client: Client = {
                id: clientId,
                ws,
                type: 'admin',
                subscribedChannels: new Set(),
                connectedAt: new Date(),
                lastHeartbeat: new Date()
            };

            this.clients.set(clientId, client);

            ws.on('message', (data) => {
                this.handleMessage(clientId, data.toString());
            });

            ws.on('close', () => {
                this.handleDisconnect(clientId);
            });

            ws.on('error', (error) => {
                console.error(`❌ WebSocket error for client ${clientId}:`, error);
                this.handleDisconnect(clientId);
            });

            // Send welcome message
            this.sendToClient(clientId, {
                id: generateId(),
                timestamp: new Date().toISOString(),
                source: 'admin',
                target: clientId,
                channel: 'connection.welcome',
                data: { clientId, serverTime: new Date().toISOString() }
            });
        });

        this.server.on('listening', () => {
            console.log(`📡 Pub/Sub broker listening on port ${this.port}`);
        });

        this.server.on('error', (error) => {
            console.error('❌ WebSocket server error:', error);
        });
    }

    private async handleMessage(clientId: string, data: string) {
        try {
            const message = parseMessage(data);
            if (!validateMessage(message)) {
                console.warn(`⚠️ Invalid message from ${clientId}:`, message);
                return;
            }

            console.log(`📨 Message from ${clientId} on channel ${message.channel}`);

            const client = this.clients.get(clientId);
            if (client) {
                client.lastHeartbeat = new Date();
            }

            await this.routeMessage(clientId, message);
        } catch (error) {
            console.error(`❌ Error handling message from ${clientId}:`, error);
        }
    }

    private async routeMessage(clientId: string, message: any) {
        switch (message.channel) {
            case 'subscribe':
                this.handleSubscribe(clientId, message.data.channel);
                break;
            case 'unsubscribe':
                this.handleUnsubscribe(clientId, message.data.channel);
                break;
            case 'node.register':
                await this.handleNodeRegister(clientId, message);
                break;
            case 'node.heartbeat':
                this.handleNodeHeartbeat(clientId, message);
                break;
            case 'publish':
                this.handlePublish(clientId, message);
                break;
            default:
                this.publishToChannel(message.channel, message, clientId);
                break;
        }
    }

    private handleSubscribe(clientId: string, channel: string) {
        const client = this.clients.get(clientId);
        if (!client) return;

        if (!this.channels.has(channel)) {
            this.channels.set(channel, new Set());
        }
        this.channels.get(channel)!.add(clientId);
        client.subscribedChannels.add(channel);

        console.log(`✅ Client ${clientId} subscribed to ${channel}`);
        
        this.sendToClient(clientId, createBaseMessage(
            'subscription.confirmed',
            { channel, subscribedAt: new Date().toISOString() },
            'admin',
            clientId
        ));
    }

    private handleUnsubscribe(clientId: string, channel: string) {
        const client = this.clients.get(clientId);
        if (!client) return;

        const channelClients = this.channels.get(channel);
        if (channelClients) {
            channelClients.delete(clientId);
            if (channelClients.size === 0) {
                this.channels.delete(channel);
            }
        }

        client.subscribedChannels.delete(channel);
        console.log(`🚫 Client ${clientId} unsubscribed from ${channel}`);
    }

    private async handleNodeRegister(clientId: string, message: any) {
        const client = this.clients.get(clientId);
        if (!client) return;

        const { nodeId, ip, ports, capabilities, version, agentVersion } = message.data;

        client.type = 'node';
        client.nodeId = nodeId;

        const nodeInfo: NodeInfo = {
            nodeId,
            clientId,
            ip,
            ports,
            capabilities,
            version,
            agentVersion,
            status: 'connected',
            connectedAt: new Date(),
            lastHeartbeat: new Date()
        };

        this.nodeRegistry.set(nodeId, nodeInfo);
        console.log(`🎯 Node registered: ${nodeId} (${ip}:${ports.turn})`);

        // Auto-subscribe node to relevant channels
        const nodeChannels = [
            'config.update',
            'user.add',
            'user.delete',
            'user.update',
            'process.control',
            'cert.update',
            'maintenance.mode',
            'emergency.shutdown',
            `node.${nodeId}.command`
        ];

        nodeChannels.forEach(channel => {
            this.handleSubscribe(clientId, channel);
        });

        // Notify other clients about new node
        this.publishToChannel('node.registry.update', 
            createBaseMessage('node.registry.update', 
                { action: 'add', node: nodeInfo }, 'admin'), clientId);

        // Send registration confirmation
        this.sendToClient(clientId, createBaseMessage(
            'node.registration.confirmed',
            {
                nodeId,
                subscribedChannels: Array.from(client.subscribedChannels),
                registeredAt: new Date().toISOString()
            },
            'admin',
            clientId
        ));
    }

    private handleNodeHeartbeat(clientId: string, message: any) {
        const client = this.clients.get(clientId);
        if (!client || !client.nodeId) return;

        const nodeInfo = this.nodeRegistry.get(client.nodeId);
        if (nodeInfo) {
            nodeInfo.lastHeartbeat = new Date();
            nodeInfo.status = message.data.status || 'connected';
            if (message.data.stats) {
                nodeInfo.stats = message.data.stats;
            }
        }

        this.publishToChannel('admin.node.heartbeat', message, clientId);
    }

    private handlePublish(clientId: string, message: any) {
        const { channel, data } = message.data;
        if (!channel || !data) {
            console.warn(`⚠️ Invalid publish message from ${clientId}`);
            return;
        }

        const pubMessage = createBaseMessage(channel, data, message.source);
        this.publishToChannel(channel, pubMessage, clientId);
    }

    private publishToChannel(channel: string, message: any, excludeClientId?: string) {
        const subscribers = this.channels.get(channel);
        if (!subscribers || subscribers.size === 0) {
            console.log(`📭 No subscribers for channel: ${channel}`);
            return;
        }

        let deliveredCount = 0;
        subscribers.forEach(clientId => {
            if (clientId === excludeClientId) return;

            const client = this.clients.get(clientId);
            if (client && client.ws.readyState === WebSocket.OPEN) {
                this.sendToClient(clientId, message);
                deliveredCount++;
            }
        });

        console.log(`📡 Published to ${channel}: ${deliveredCount} recipients`);
    }

    private sendToClient(clientId: string, message: any) {
        const client = this.clients.get(clientId);
        if (!client || client.ws.readyState !== WebSocket.OPEN) {
            console.warn(`⚠️ Cannot send to client ${clientId}: connection not available`);
            return;
        }

        try {
            client.ws.send(stringifyMessage(message));
        } catch (error) {
            console.error(`❌ Error sending message to ${clientId}:`, error);
            this.handleDisconnect(clientId);
        }
    }

    private handleDisconnect(clientId: string) {
        const client = this.clients.get(clientId);
        if (!client) return;

        console.log(`🔌 Client disconnected: ${clientId}`);

        client.subscribedChannels.forEach(channel => {
            const channelClients = this.channels.get(channel);
            if (channelClients) {
                channelClients.delete(clientId);
                if (channelClients.size === 0) {
                    this.channels.delete(channel);
                }
            }
        });

        if (client.nodeId) {
            const nodeInfo = this.nodeRegistry.get(client.nodeId);
            if (nodeInfo) {
                nodeInfo.status = 'disconnected';
                this.publishToChannel('node.registry.update',
                    createBaseMessage('node.registry.update',
                        { action: 'disconnect', nodeId: client.nodeId }, 'admin'));
            }
        }

        this.clients.delete(clientId);
    }

    private startHeartbeatMonitor() {
        this.heartbeatInterval = setInterval(() => {
            const now = new Date();
            const timeoutMs = 30000;

            this.clients.forEach((client, clientId) => {
                const timeSinceHeartbeat = now.getTime() - client.lastHeartbeat.getTime();
                if (timeSinceHeartbeat > timeoutMs) {
                    console.log(`💔 Client ${clientId} heartbeat timeout`);
                    this.handleDisconnect(clientId);
                }
            });
        }, 10000);
    }

    // Public API methods
    getConnectedNodes() {
        return Array.from(this.nodeRegistry.values())
            .filter(node => node.status !== 'disconnected' && node.status !== 'error');
    }

    getChannelSubscribers(channel: string) {
        const subscribers = this.channels.get(channel);
        return subscribers ? Array.from(subscribers) : [];
    }

    getClientStats() {
        return {
            totalClients: this.clients.size,
            totalNodes: this.nodeRegistry.size,
            connectedNodes: this.getConnectedNodes().length,
            totalChannels: this.channels.size,
            uptime: process.uptime()
        };
    }

    broadcastToNodes(message: any) {
        this.clients.forEach((client, clientId) => {
            if (client.type === 'node') {
                this.sendToClient(clientId, message);
            }
        });
    }

    sendToNode(nodeId: string, message: any) {
        const nodeInfo = this.nodeRegistry.get(nodeId);
        if (!nodeInfo) return false;

        if (nodeInfo.status === 'disconnected' || nodeInfo.status === 'error') {
            return false;
        }

        this.sendToClient(nodeInfo.clientId, message);
        return true;
    }

    stop() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        this.server.close(() => {
            console.log('📡 Pub/Sub broker stopped');
        });
    }

    getNodeRegistry() {
        return this.nodeRegistry;
    }

    debugNodeRegistry() {
        console.log('🔍 Node Registry Debug:');
        console.log(`Total registered nodes: ${this.nodeRegistry.size}`);
        this.nodeRegistry.forEach((node, nodeId) => {
            console.log(`- ${nodeId}: ${node.status} (${node.ip}:${node.ports.turn})`);
        });
    }

    debugInfo() {
        return {
            totalClients: this.clients.size,
            totalNodes: this.nodeRegistry.size,
            nodeIds: Array.from(this.nodeRegistry.keys()),
            nodeStatuses: Array.from(this.nodeRegistry.values()).map(n => ({
                id: n.nodeId,
                status: n.status,
                ip: n.ip
            }))
        };
    }
}
