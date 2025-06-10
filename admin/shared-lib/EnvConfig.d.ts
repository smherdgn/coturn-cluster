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
export declare class EnvConfigManager {
    private config;
    constructor();
    private loadConfig;
    getConfig(): ClusterConfig;
    getServiceUrl(service: 'admin' | 'coturn', type: 'api' | 'dashboard' | 'pubsub' | 'agent'): string;
    displayConfig(): void;
}
export declare const envConfig: EnvConfigManager;
