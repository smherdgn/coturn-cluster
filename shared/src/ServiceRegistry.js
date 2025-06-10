"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceRegistry = exports.ServiceRegistry = void 0;
const fs_1 = require("fs");
class ServiceRegistry {
    constructor(registryFile = './service-registry.json') {
        this.services = new Map();
        this.registryFile = registryFile;
        this.loadFromFile();
        // Auto-save every 10 seconds
        setInterval(() => this.saveToFile(), 10000);
        // Cleanup stale services every 30 seconds
        setInterval(() => this.cleanupStaleServices(), 30000);
    }
    register(service) {
        const serviceKey = `${service.name}-${service.type}`;
        const serviceInfo = {
            ...service,
            registeredAt: new Date(),
            lastHeartbeat: new Date()
        };
        this.services.set(serviceKey, serviceInfo);
        this.saveToFile();
        console.log(`📋 Service registered: ${serviceKey} at ${service.host}:${service.port}`);
    }
    unregister(name, type) {
        const serviceKey = `${name}-${type}`;
        this.services.delete(serviceKey);
        this.saveToFile();
        console.log(`📋 Service unregistered: ${serviceKey}`);
    }
    heartbeat(name, type, status = 'healthy') {
        const serviceKey = `${name}-${type}`;
        const service = this.services.get(serviceKey);
        if (service) {
            service.lastHeartbeat = new Date();
            service.status = status;
            console.log(`💓 Heartbeat: ${serviceKey} (${status})`);
        }
    }
    discover(type) {
        const services = Array.from(this.services.values());
        if (type) {
            return services.filter(s => s.type === type && s.status === 'healthy');
        }
        return services.filter(s => s.status === 'healthy');
    }
    getService(name, type) {
        const serviceKey = `${name}-${type}`;
        return this.services.get(serviceKey) || null;
    }
    getEndpoints() {
        const endpoints = {};
        this.services.forEach((service, key) => {
            if (service.status === 'healthy') {
                endpoints[service.type] = {
                    name: service.name,
                    url: `http://${service.host}:${service.port}`,
                    endpoints: service.endpoints || {},
                    metadata: service.metadata || {}
                };
            }
        });
        return endpoints;
    }
    loadFromFile() {
        try {
            if ((0, fs_1.existsSync)(this.registryFile)) {
                const data = (0, fs_1.readFileSync)(this.registryFile, 'utf8');
                const services = JSON.parse(data);
                services.forEach((service) => {
                    // Convert date strings back to Date objects
                    service.registeredAt = new Date(service.registeredAt);
                    service.lastHeartbeat = new Date(service.lastHeartbeat);
                    const serviceKey = `${service.name}-${service.type}`;
                    this.services.set(serviceKey, service);
                });
                console.log(`📋 Loaded ${services.length} services from registry`);
            }
        }
        catch (error) {
            console.warn('⚠️ Failed to load service registry:', error);
        }
    }
    saveToFile() {
        try {
            const services = Array.from(this.services.values());
            (0, fs_1.writeFileSync)(this.registryFile, JSON.stringify(services, null, 2));
        }
        catch (error) {
            console.error('❌ Failed to save service registry:', error);
        }
    }
    cleanupStaleServices() {
        const now = Date.now();
        const staleThreshold = 60000; // 60 seconds
        this.services.forEach((service, key) => {
            const timeSinceHeartbeat = now - service.lastHeartbeat.getTime();
            if (timeSinceHeartbeat > staleThreshold) {
                console.log(`🧹 Removing stale service: ${key} (${timeSinceHeartbeat}ms old)`);
                this.services.delete(key);
            }
        });
    }
    getStatus() {
        const services = Array.from(this.services.values());
        const healthy = services.filter(s => s.status === 'healthy');
        const servicesByType = {};
        healthy.forEach(service => {
            servicesByType[service.type] = (servicesByType[service.type] || 0) + 1;
        });
        return {
            totalServices: services.length,
            healthyServices: healthy.length,
            servicesByType
        };
    }
}
exports.ServiceRegistry = ServiceRegistry;
// Singleton instance
exports.serviceRegistry = new ServiceRegistry();
//# sourceMappingURL=ServiceRegistry.js.map