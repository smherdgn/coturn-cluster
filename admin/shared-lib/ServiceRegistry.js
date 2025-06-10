"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceRegistry = void 0;
class ServiceRegistry {
    constructor(adminUrl = 'http://localhost:8080') {
        this.services = new Map();
        this.adminUrl = adminUrl;
    }
    async discoverService(servicePattern) {
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
            services.forEach((service) => {
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
        }
        catch (error) {
            console.error(`❌ Service discovery error for ${servicePattern}:`, error);
            return null;
        }
    }
    async discoverAdminPubSub() {
        try {
            // Try direct connection first
            const adminPubsubUrl = this.adminUrl.replace(/:\d+/, ':9000');
            return {
                host: 'localhost',
                port: 9000
            };
        }
        catch (error) {
            console.error('❌ Admin PubSub discovery error:', error);
            return null;
        }
    }
    registerService(serviceId, host, port, metadata) {
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
    unregisterService(serviceId) {
        const removed = this.services.delete(serviceId);
        if (removed) {
            console.log(`📋 Service unregistered: ${serviceId}`);
        }
        return removed;
    }
    getService(serviceId) {
        return this.services.get(serviceId);
    }
    getAllServices() {
        return Array.from(this.services.values());
    }
    getActiveServices() {
        return Array.from(this.services.values())
            .filter(service => service.status === 'active');
    }
    updateServiceStatus(serviceId, status) {
        const service = this.services.get(serviceId);
        if (service) {
            service.status = status;
            service.lastSeen = new Date();
        }
    }
    // Health check for registered services
    async healthCheck() {
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
                }
                else {
                    this.updateServiceStatus(service.serviceId, 'error');
                }
            }
            catch (error) {
                this.updateServiceStatus(service.serviceId, 'error');
            }
        });
        await Promise.allSettled(promises);
    }
    // Cleanup inactive services
    cleanup(maxAge = 300000) {
        const now = new Date();
        const toRemove = [];
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
exports.ServiceRegistry = ServiceRegistry;
