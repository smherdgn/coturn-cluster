// admin/src/server.ts
import { PubSubBroker } from './pubsub/broker';
import { AdminAPIServer } from './api/server';
import { envConfig } from '../../shared/dist/EnvConfig.js';

async function startAdminCluster() {
    try {
        console.log('🚀 Starting Coturn Admin Cluster...');
        console.log('🔧 === CLUSTER CONFIGURATION ===');
        console.log(`Deployment ID: ${envConfig.getConfig().DEPLOYMENT_ID}`);
        console.log(`Environment: ${envConfig.getConfig().NODE_ENV}`);
        console.log('');
        console.log(`📊 Admin API Server: http://localhost:${envConfig.getConfig().ADMIN_API_PORT}`);
        console.log(`🎛️  Dashboard: http://localhost:${envConfig.getConfig().ADMIN_API_PORT}`);
        console.log(`📡 Pub/Sub: ws://localhost:${envConfig.getConfig().ADMIN_PUBSUB_PORT}`);
        console.log(`🤖 Agent: http://localhost:${envConfig.getConfig().COTURN_AGENT_PORT}`);
        console.log('=============================');

        // Start pub/sub broker (database independent)
        console.log('📡 Starting pub/sub broker...');
        const pubsubBroker = new PubSubBroker(envConfig.getConfig().ADMIN_PUBSUB_PORT);

        // Start API server
        console.log('📊 Starting API server...');
        const apiServer = new AdminAPIServer(envConfig.getConfig().ADMIN_API_PORT, pubsubBroker);
        await apiServer.start();

        console.log('✅ Admin cluster started successfully!');

    } catch (error) {
        console.error('❌ Failed to start admin cluster:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🔄 Shutting down admin cluster...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🔄 Shutting down admin cluster...');
    process.exit(0);
});

startAdminCluster();
