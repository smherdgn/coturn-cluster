"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envConfig = exports.EnvConfigManager = void 0;
const dotenv_1 = require("dotenv");
class EnvConfigManager {
    constructor(envPath) {
        // Load environment variables
        if (envPath) {
            (0, dotenv_1.config)({ path: envPath });
        }
        else {
            // Try to load from project root
            const possiblePaths = [
                '.env',
                '../.env',
                '../../.env'
            ];
            for (const path of possiblePaths) {
                try {
                    (0, dotenv_1.config)({ path });
                    break;
                }
                catch (error) {
                    // Continue to next path
                }
            }
        }
        this.config = this.parseEnvironment();
        this.validateConfig();
    }
    parseEnvironment() {
        return {
            // Admin API Server
            ADMIN_API_HOST: process.env.ADMIN_API_HOST || 'localhost',
            ADMIN_API_PORT: parseInt(process.env.ADMIN_API_PORT || '8084'),
            // Dashboard  
            ADMIN_DASHBOARD_HOST: process.env.ADMIN_DASHBOARD_HOST || 'localhost',
            ADMIN_DASHBOARD_PORT: parseInt(process.env.ADMIN_DASHBOARD_PORT || '3001'),
            // WebSocket Pub/Sub
            ADMIN_PUBSUB_HOST: process.env.ADMIN_PUBSUB_HOST || 'localhost',
            ADMIN_PUBSUB_PORT: parseInt(process.env.ADMIN_PUBSUB_PORT || '9000'),
            // Coturn Node Agent
            COTURN_AGENT_HOST: process.env.COTURN_AGENT_HOST || 'localhost',
            COTURN_AGENT_PORT: parseInt(process.env.COTURN_AGENT_PORT || '8082'),
            // Database
            POSTGRES_HOST: process.env.POSTGRES_HOST || 'localhost',
            POSTGRES_PORT: parseInt(process.env.POSTGRES_PORT || '5432'),
            // Deployment
            DEPLOYMENT_ID: process.env.DEPLOYMENT_ID || `coturn-${Date.now()}`,
            NODE_ENV: process.env.NODE_ENV || 'development'
        };
    }
    validateConfig() {
        const errors = [];
        // Check for port conflicts
        const ports = [
            this.config.ADMIN_API_PORT,
            this.config.ADMIN_DASHBOARD_PORT,
            this.config.ADMIN_PUBSUB_PORT,
            this.config.COTURN_AGENT_PORT
        ];
        const duplicatePorts = ports.filter((port, index) => ports.indexOf(port) !== index);
        if (duplicatePorts.length > 0) {
            errors.push(`Port conflicts detected: ${duplicatePorts.join(', ')}`);
        }
        // Validate port ranges
        ports.forEach(port => {
            if (port < 1024 || port > 65535) {
                errors.push(`Invalid port: ${port} (must be between 1024-65535)`);
            }
        });
        if (errors.length > 0) {
            throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
        }
        console.log('✅ Configuration validation passed');
    }
    getConfig() {
        return { ...this.config };
    }
    getServiceUrl(type) {
        switch (type) {
            case 'api':
                return `http://${this.config.ADMIN_API_HOST}:${this.config.ADMIN_API_PORT}`;
            case 'dashboard':
                return `http://${this.config.ADMIN_DASHBOARD_HOST}:${this.config.ADMIN_DASHBOARD_PORT}`;
            case 'pubsub':
                return `ws://${this.config.ADMIN_PUBSUB_HOST}:${this.config.ADMIN_PUBSUB_PORT}`;
            case 'agent':
                return `http://${this.config.COTURN_AGENT_HOST}:${this.config.COTURN_AGENT_PORT}`;
            default:
                throw new Error(`Unknown service type: ${type}`);
        }
    }
    getEndpoints() {
        return {
            api: {
                url: this.getServiceUrl('api'),
                endpoints: {
                    users: '/api/users',
                    cluster: '/api/cluster/status',
                    stats: '/api/stats',
                    nodes: '/api/nodes'
                }
            },
            dashboard: {
                url: this.getServiceUrl('dashboard')
            },
            pubsub: {
                url: this.getServiceUrl('pubsub')
            },
            agent: {
                url: this.getServiceUrl('agent'),
                endpoints: {
                    health: '/health',
                    stats: '/stats'
                }
            }
        };
    }
    displayConfig() {
        console.log('🔧 === CLUSTER CONFIGURATION ===');
        console.log(`Deployment ID: ${this.config.DEPLOYMENT_ID}`);
        console.log(`Environment: ${this.config.NODE_ENV}`);
        console.log('');
        console.log('📊 Admin API Server:', this.getServiceUrl('api'));
        console.log('🎛️  Dashboard:', this.getServiceUrl('dashboard'));
        console.log('📡 Pub/Sub:', this.getServiceUrl('pubsub'));
        console.log('🤖 Agent:', this.getServiceUrl('agent'));
        console.log('🗄️  Database:', `postgres://${this.config.POSTGRES_HOST}:${this.config.POSTGRES_PORT}`);
        console.log('=============================');
    }
}
exports.EnvConfigManager = EnvConfigManager;
// Singleton instance
exports.envConfig = new EnvConfigManager();
//# sourceMappingURL=EnvConfig.js.map