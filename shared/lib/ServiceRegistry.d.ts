interface ServiceInfo {
    serviceId: string;
    host: string;
    port: number;
    status: 'active' | 'inactive' | 'error';
    metadata?: any;
    registeredAt: Date;
    lastSeen: Date;
}
export declare class ServiceRegistry {
    private services;
    private adminUrl;
    constructor(adminUrl?: string);
    discoverService(servicePattern: string): Promise<ServiceInfo | null>;
    discoverAdminPubSub(): Promise<{
        host: string;
        port: number;
    } | null>;
    registerService(serviceId: string, host: string, port: number, metadata?: any): void;
    unregisterService(serviceId: string): boolean;
    getService(serviceId: string): ServiceInfo | undefined;
    getAllServices(): ServiceInfo[];
    getActiveServices(): ServiceInfo[];
    updateServiceStatus(serviceId: string, status: 'active' | 'inactive' | 'error'): void;
    healthCheck(): Promise<void>;
    cleanup(maxAge?: number): void;
}
export {};
