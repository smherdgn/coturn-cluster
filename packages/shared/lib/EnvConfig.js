"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.envConfig = exports.EnvConfigManager = void 0;
// shared/src/EnvConfig.ts
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
class EnvConfigManager {
    constructor() {
        this.config = this.loadConfig();
    }
    loadConfig() {
        return {
            ADMIN_API_PORT: parseInt(process.env.ADMIN_API_PORT || '8080'),
            ADMIN_DASHBOARD_PORT: parseInt(process.env.ADMIN_DASHBOARD_PORT || '3000'),
            ADMIN_PUBSUB_PORT: parseInt(process.env.ADMIN_PUBSUB_PORT || '9000'),
            COTURN_AGENT_PORT: parseInt(process.env.COTURN_AGENT_PORT || '8100'),
            COTURN_PORT: parseInt(process.env.COTURN_PORT || '3478'),
            COTURN_TLS_PORT: parseInt(process.env.COTURN_TLS_PORT || '5349'),
            POSTGRES_HOST: process.env.POSTGRES_HOST || 'localhost',
            POSTGRES_PORT: parseInt(process.env.POSTGRES_PORT || '5432'),
            DEPLOYMENT_ID: process.env.DEPLOYMENT_ID || 'default',
            NODE_ENV: process.env.NODE_ENV || 'development'
        };
    }
    getConfig() {
        return this.config;
    }
    getServiceUrl(service, type) {
        const host = 'localhost';
        let port;
        switch (`${service}.${type}`) {
            case 'admin.api':
                port = this.config.ADMIN_API_PORT;
                break;
            case 'admin.dashboard':
                port = this.config.ADMIN_DASHBOARD_PORT;
                break;
            case 'admin.pubsub':
                port = this.config.ADMIN_PUBSUB_PORT;
                return `ws://${host}:${port}`;
            case 'coturn.agent':
                port = this.config.COTURN_AGENT_PORT;
                break;
            default:
                throw new Error(`Unknown service: ${service}.${type}`);
        }
        return `http://${host}:${port}`;
    }
    displayConfig() {
        console.log('🔧 === CLUSTER CONFIGURATION ===');
        console.log(`Deployment ID: ${this.config.DEPLOYMENT_ID}`);
        console.log(`Environment: ${this.config.NODE_ENV}`);
        console.log('');
        console.log(`📊 Admin API Server: http://localhost:${this.config.ADMIN_API_PORT}`);
        console.log(`🎛️ Dashboard: http://localhost:${this.config.ADMIN_DASHBOARD_PORT}`);
        console.log(`📡 Pub/Sub: ws://localhost:${this.config.ADMIN_PUBSUB_PORT}`);
        console.log(`🤖 Agent: http://localhost:${this.config.COTURN_AGENT_PORT}`);
        console.log('=============================');
    }
}
exports.EnvConfigManager = EnvConfigManager;
exports.envConfig = new EnvConfigManager();
