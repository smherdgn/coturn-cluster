// coturn-node/src/agent.ts
import express from 'express';
import WebSocket from 'ws';
import { CoturnManager } from './coturn/manager/CoturnManager';
import { envConfig } from '../../shared/lib/EnvConfig';
import { ServiceRegistry } from '../../shared/lib/ServiceRegistry';
import { generateId, createBaseMessage } from '../../shared/lib/utils';

export class CoturnAgent {
    private app: express.Application;
    private coturnManager: CoturnManager;
    private nodeId: string;
    private ws: WebSocket | null = null;
    private serviceRegistry: ServiceRegistry;
    private reconnectInterval: NodeJS.Timeout | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.nodeId = this.generateNodeId();
        this.app = express();
        this.coturnManager = new CoturnManager();
        this.serviceRegistry = new ServiceRegistry();
        this.setupAPI();
        this.setupGracefulShutdown();
    }

    private generateNodeId(): string {
        const hostname = require('os').hostname();
        const suffix = generateId().slice(-8);
        return `${hostname}-${suffix}`;
    }

    private setupAPI() {
        this.app.use(express.json());

        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                nodeId: this.nodeId,
                timestamp: new Date().toISOString(),
                coturn: this.coturnManager.getStatus(),
                connected: this.ws?.readyState === WebSocket.OPEN
            });
        });

        this.app.get('/status', (req, res) => {
            res.json({
                nodeId: this.nodeId,
                status: this.getStatus(),
                coturn: this.coturnManager.getStatus(),
                stats: this.getStats()
            });
        });

        this.app.post('/users', async (req, res) => {
            try {
                const { username, password, realm } = req.body;
                await this.coturnManager.addUser(username, password, realm);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
            }
        });

        this.app.delete('/users/:username', async (req, res) => {
            try {
                const { username } = req.params;
                await this.coturnManager.deleteUser(username);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
            }
        });
    }

    async start() {
        try {
            console.log('✅ Configuration validation passed');
            
            const config = envConfig.getConfig();
            
            // Register in service registry
            this.serviceRegistry.registerService(
                `coturn-node-${this.nodeId}`,
                'localhost',
                config.COTURN_AGENT_PORT,
                {
                    nodeId: this.nodeId,
                    type: 'coturn-node',
                    version: '1.0.0'
                }
            );

            console.log(`📋 Node registered in service registry: ${this.nodeId}`);

            // Register with alternative ID format for compatibility
            this.serviceRegistry.registerService(
                `coturn-node-${this.getLocalIP()}-node`,
                'localhost',
                config.COTURN_AGENT_PORT,
                {
                    nodeId: this.nodeId,
                    type: 'coturn-node'
                }
            );

            // Start HTTP server
            this.app.listen(config.COTURN_AGENT_PORT, () => {
                console.log(`🤖 Agent server running on port ${config.COTURN_AGENT_PORT}`);
                console.log(`🆔 Node ID: ${this.nodeId}`);
            });

            // Initialize Coturn Manager
            console.log('🔧 Initializing Coturn Manager...');
            await this.coturnManager.initialize();
            console.log('✅ Coturn Manager initialized successfully');

            // Connect to admin pub/sub
            await this.connectToAdmin();

            // Start heartbeat
            this.startHeartbeat();

        } catch (error) {
            console.error('❌ Failed to start agent:', error);
            process.exit(1);
        }
    }

    private async connectToAdmin() {
        try {
            // Discover admin pub/sub through service registry
            console.log('🔍 Discovering admin pub/sub...');
            const pubsubInfo = await this.serviceRegistry.discoverAdminPubSub();
            
            if (!pubsubInfo) {
                console.log('⚠️ Admin pub/sub not discovered, using default connection');
            }

            const host = pubsubInfo?.host || 'localhost';
            const port = pubsubInfo?.port || envConfig.getConfig().ADMIN_PUBSUB_PORT;

            console.log(`🔗 Connecting to admin pub/sub: ws://${host}:${port}`);
            
            this.ws = new WebSocket(`ws://${host}:${port}`);

            this.ws.on('open', () => {
                console.log('✅ Connected to admin pub/sub');
                this.registerWithAdmin();
            });

            this.ws.on('message', (data) => {
                this.handleAdminMessage(data.toString());
            });

            this.ws.on('close', (code, reason) => {
                console.log(`🔌 Connection closed (${code}): ${reason}`);
                this.scheduleReconnect();
            });

            this.ws.on('error', (error) => {
                console.error('❌ WebSocket error:', error);
                this.scheduleReconnect();
            });

        } catch (error) {
            console.error('❌ Failed to connect to admin:', error);
            this.scheduleReconnect();
        }
    }

    private scheduleReconnect() {
        if (this.reconnectInterval) return;

        console.log('🔄 Starting reconnection attempts...');
        this.reconnectInterval = setInterval(async () => {
            await this.connectToAdmin();
        }, 5000);
    }

    private registerWithAdmin() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const config = envConfig.getConfig();
        const registrationMessage = createBaseMessage('node.register', {
            nodeId: this.nodeId,
            ip: this.getLocalIP(),
            ports: {
                turn: 3478, // Default TURN port
                tls: 5349,  // Default TURN TLS port
                agent: config.COTURN_AGENT_PORT
            },
            capabilities: ['turn', 'stun', 'relay'],
            version: '1.0.0',
            agentVersion: '1.0.0'
        }, 'coturn-node');

        this.ws.send(JSON.stringify(registrationMessage));

        // Clear reconnect interval on successful registration
        if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
        }
    }

    private handleAdminMessage(data: string) {
        try {
            const message = JSON.parse(data);
            console.log(`📨 Received message on channel: ${message.channel}`);

            switch (message.channel) {
                case 'node.registration.confirmed':
                    console.log('✅ Registration confirmed by admin');
                    break;
                case 'user.add':
                    this.handleUserAdd(message.data);
                    break;
                case 'user.delete':
                    this.handleUserDelete(message.data);
                    break;
                case 'config.update':
                    this.handleConfigUpdate(message.data);
                    break;
                case 'process.control':
                    this.handleProcessControl(message.data);
                    break;
                default:
                    console.log(`📭 Unhandled message on channel: ${message.channel}`);
            }
        } catch (error) {
            console.error('❌ Error handling admin message:', error);
        }
    }

    private async handleUserAdd(data: any) {
        try {
            const { username, password, realm } = data;
            await this.coturnManager.addUser(username, password, realm);
            console.log(`👤 User added: ${username}`);
        } catch (error) {
            console.error('❌ Error adding user:', error);
        }
    }

    private async handleUserDelete(data: any) {
        try {
            const { username } = data;
            await this.coturnManager.deleteUser(username);
            console.log(`👤 User deleted: ${username}`);
        } catch (error) {
            console.error('❌ Error deleting user:', error);
        }
    }

    private async handleConfigUpdate(data: any) {
        try {
            await this.coturnManager.updateConfig(data);
            console.log('⚙️ Configuration updated');
        } catch (error) {
            console.error('❌ Error updating config:', error);
        }
    }

    private async handleProcessControl(data: any) {
        try {
            const { action } = data;
            switch (action) {
                case 'start':
                    await this.coturnManager.start();
                    break;
                case 'stop':
                    await this.coturnManager.stop();
                    break;
                case 'restart':
                    await this.coturnManager.restart();
                    break;
                default:
                    console.warn(`⚠️ Unknown process control action: ${action}`);
            }
        } catch (error) {
            console.error('❌ Error in process control:', error);
        }
    }

    private startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                const heartbeatMessage = createBaseMessage('node.heartbeat', {
                    nodeId: this.nodeId,
                    status: this.getStatus(),
                    stats: this.getStats(),
                    timestamp: new Date().toISOString()
                }, 'coturn-node');

                this.ws.send(JSON.stringify(heartbeatMessage));
                console.log(`💓 Heartbeat: coturn-node-${this.nodeId}-node (${this.getStatus()})`);
            }
        }, 30000); // Every 30 seconds
    }

    private getStatus(): string {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            return 'healthy';
        }
        return 'disconnected';
    }

    private getStats() {
        return {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            coturn: this.coturnManager.getStats()
        };
    }

    private getLocalIP(): string {
        const interfaces = require('os').networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
        return '192.168.1.12'; // Fallback
    }

    private setupGracefulShutdown() {
        process.on('SIGINT', async () => {
            console.log('🔄 Shutting down coturn agent...');
            await this.shutdown();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('🔄 Shutting down coturn agent...');
            await this.shutdown();
            process.exit(0);
        });
    }

    private async shutdown() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
        }
        if (this.ws) {
            this.ws.close();
        }
        await this.coturnManager.stop();
    }
}

// Start the agent
if (require.main === module) {
    const agent = new CoturnAgent();
    agent.start().catch(console.error);
}
