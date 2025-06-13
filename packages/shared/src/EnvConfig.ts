// shared/src/EnvConfig.ts
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

export interface ClusterConfig {
ADMIN_API_PORT: number;
ADMIN_DASHBOARD_PORT: number;
ADMIN_PUBSUB_PORT: number;
COTURN_AGENT_PORT: number;
COTURN_PORT: number;
COTURN_TLS_PORT: number;
POSTGRES_HOST: string;
POSTGRES_PORT: number;
DEPLOYMENT_ID: string;
NODE_ENV: string;
}

export class EnvConfigManager {
private config: ClusterConfig;

constructor() {
this.config = this.loadConfig();
}

private loadConfig(): ClusterConfig {
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

getConfig(): ClusterConfig {
return this.config;
}

getServiceUrl(service: 'admin' | 'coturn', type: 'api' | 'dashboard' | 'pubsub' | 'agent'): string {
const host = 'localhost';
let port: number;

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

export const envConfig = new EnvConfigManager();
