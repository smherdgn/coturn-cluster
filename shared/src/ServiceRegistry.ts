// shared/src/ServiceRegistry.ts
interface ServiceInfo {
    serviceId: string;
    host: string;
    port: number;
    status: 'active' | 'inactive' | 'error';
    metadata?: any;
    registeredAt: Date;
    lastSeen: Date;
}

export class ServiceRegistry {
    private services = new Map<string, ServiceInfo>();
    private adminUrl: string;

    constructor(adminUrl = 'http://localhost:8080') {
        this.adminUrl = adminUrl;
    }

    async discoverService(servicePattern: string): Promise<ServiceInfo | null> {
        try {
            // First check local cache
            for (const [serviceId, service] of this.services) {
                if (serviceId.includes(servicePattern) && service.status === 'active') {
                    return service;
                }
            }

            // If not found, fetch from admin API
            const response = await fetch(`${this.adminUrl}/api/services`);
            if (!response.ok) {
                console.warn(`⚠️ Failed to fetch services from admin: ${response.status}`);
                return null;
            }

            const services = await response.json();
            
            // Update local cache
            services.forEach((service: any) => {
                this.services.set(service.serviceId, {
                    serviceId: service.serviceId,
                    host: service.host,
                    port: service.port,
                    status: service.status === 'connected' ? 'active' : 'inactive',
                    metadata: service.metadata,
                    registeredAt: new Date(service.metadata?.connectedAt || Date.now()),
                    lastSeen: new Date(service.metadata?.lastHeartbeat || Date.now())
                });
            });

            // Find matching service
            for (const [serviceId, service] of this.services) {
                if (serviceId.includes(servicePattern) && service.status === 'active') {
                    return service;
                }
            }

            return null;
        } catch (error) {
            console.error(`❌ Service discovery error for ${servicePattern}:`, error);
            return null;
        }
    }

    async discoverAdminPubSub(): Promise<{ host: string; port: number } | null> {
        try {
            // Try direct connection first
            const adminPubsubUrl = this.adminUrl.replace(/:\d+/, ':9000');
            
            return {
                host: 'localhost',
                port: 9000
            };
        } catch (error) {
            console.error('❌ Admin PubSub discovery error:', error);
            return null;
        }
    }

    registerService(serviceId: string, host: string, port: number, metadata?: any) {
        console.log(`📋 Service registered: ${serviceId} at ${host}:${port}`);
        
        this.services.set(serviceId, {
            serviceId,
            host,
            port,
            status: 'active',
            metadata,
            registeredAt: new Date(),
            lastSeen: new Date()
        });
    }

    unregisterService(serviceId: string): boolean {
        const removed = this.services.delete(serviceId);
        if (removed) {
            console.log(`📋 Service unregistered: ${serviceId}`);
        }
        return removed;
    }

    getService(serviceId: string): ServiceInfo | undefined {
        return this.services.get(serviceId);
    }

    getAllServices(): ServiceInfo[] {
        return Array.from(this.services.values());
    }

    getActiveServices(): ServiceInfo[] {
        return Array.from(this.services.values())
            .filter(service => service.status === 'active');
    }

    updateServiceStatus(serviceId: string, status: 'active' | 'inactive' | 'error') {
        const service = this.services.get(serviceId);
        if (service) {
            service.status = status;
            service.lastSeen = new Date();
        }
    }

    // Health check for registered services
    async healthCheck(): Promise<void> {
        const promises = Array.from(this.services.values()).map(async (service) => {
            try {
                // Simple TCP connection check
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const response = await fetch(`http://${service.host}:${service.port}/health`, {
                    signal: controller.signal,
                    method: 'GET'
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    this.updateServiceStatus(service.serviceId, 'active');
                } else {
                    this.updateServiceStatus(service.serviceId, 'error');
                }
            } catch (error) {
                this.updateServiceStatus(service.serviceId, 'error');
            }
        });

        await Promise.allSettled(promises);
    }

    // Cleanup inactive services
    cleanup(maxAge = 300000) { // 5 minutes
        const now = new Date();
        const toRemove: string[] = [];

        this.services.forEach((service, serviceId) => {
            const age = now.getTime() - service.lastSeen.getTime();
            if (age > maxAge && service.status !== 'active') {
                toRemove.push(serviceId);
            }
        });

        toRemove.forEach(serviceId => {
            this.unregisterService(serviceId);
        });
    }
}
