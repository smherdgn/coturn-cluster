import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export class DockerManager {
    async createCoturnNode(nodeId: string, ip: string, ports: { agent: number; turn: number; tls: number }): Promise<void> {
        const containerName = `coturn-node-${nodeId}`;
        
        console.log(`🐳 Creating Docker container: ${containerName}`);
        
        // Existing coturn-node image'ını kullan ve yeni port'larla başlat
        const dockerRunCommand = `
            docker run -d \
                --name ${containerName} \
                --network coturn-cluster_coturn-net \
                -p ${ports.agent}:${ports.agent} \
                -p ${ports.turn}:${ports.turn}/udp \
                -p ${ports.tls}:${ports.tls}/tcp \
                -e NODE_ENV=development \
                -e NODE_ID=${nodeId} \
                -e COTURN_AGENT_PORT=${ports.agent} \
                -e COTURN_PORT=${ports.turn} \
                -e COTURN_TLS_PORT=${ports.tls} \
                -e COTURN_MIN_PORT=49152 \
                -e COTURN_MAX_PORT=65535 \
                -e COTURN_REALM=example.com \
                -e COTURN_SECRET=\${COTURN_SECRET:-default-secret} \
                -e ADMIN_PUBSUB_URL=ws://host.docker.internal:9000 \
                -v coturn-cluster_coturn_config:/etc/turnserver \
                -v coturn-cluster_coturn_logs:/var/log/coturn \
                -v \${PWD}/shared:/app/shared:ro \
                coturn-cluster_coturn-node:latest
        `;

        await execAsync(dockerRunCommand.replace(/\s+/g, ' ').trim());
        console.log(`✅ Container ${containerName} started successfully`);
        
        // Container'ın başlamasını bekle
        await this.waitForContainer(containerName);
    }

    async removeCoturnNode(nodeId: string): Promise<void> {
        const containerName = `coturn-node-${nodeId}`;
        
        console.log(`🗑️ Removing Docker container: ${containerName}`);
        
        try {
            await execAsync(`docker stop ${containerName}`);
            await execAsync(`docker rm ${containerName}`);
            console.log(`✅ Container ${containerName} removed successfully`);
        } catch (error) {
            console.warn(`⚠️ Container ${containerName} may not exist or already removed`);
        }
    }

    async restartCoturnNode(nodeId: string): Promise<void> {
        const containerName = `coturn-node-${nodeId}`;
        
        console.log(`🔄 Restarting Docker container: ${containerName}`);
        await execAsync(`docker restart ${containerName}`);
        console.log(`✅ Container ${containerName} restarted successfully`);
    }

    async getContainerLogs(nodeId: string): Promise<string> {
        const containerName = `coturn-node-${nodeId}`;
        
        try {
            const { stdout, stderr } = await execAsync(`docker logs ${containerName} --tail=500`);
            return stdout + '\n' + stderr;
        } catch (error) {
            return `Error getting logs for ${containerName}: ${error}`;
        }
    }

    async listCoturnNodes(): Promise<string[]> {
        try {
            const { stdout } = await execAsync(`docker ps --filter "name=coturn-node-" --format "{{.Names}}"`);
            return stdout.trim().split('\n').filter(name => name.length > 0);
        } catch (error) {
            return [];
        }
    }

    private async waitForContainer(containerName: string, timeoutMs: number = 30000): Promise<void> {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeoutMs) {
            try {
                const { stdout } = await execAsync(`docker inspect ${containerName} --format="{{.State.Status}}"`);
                if (stdout.trim() === 'running') {
                    console.log(`✅ Container ${containerName} is running`);
                    return;
                }
            } catch (error) {
                // Container not found yet, continue waiting
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        throw new Error(`Container ${containerName} failed to start within ${timeoutMs}ms`);
    }

    async getContainerStats(nodeId: string): Promise<any> {
        const containerName = `coturn-node-${nodeId}`;
        
        try {
            const { stdout } = await execAsync(`docker stats ${containerName} --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"`);
            return { stats: stdout.trim(), status: 'running' };
        } catch (error) {
            return { error: `Container ${containerName} not found or not running` };
        }
    }
}
