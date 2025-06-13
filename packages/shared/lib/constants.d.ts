export declare const DEFAULT_PORTS: {
    readonly ADMIN_API: 8080;
    readonly ADMIN_DASHBOARD: 3000;
    readonly ADMIN_PUBSUB: 9001;
    readonly COTURN_TURN: 3478;
    readonly COTURN_TURNS: 5349;
    readonly COTURN_AGENT: 8080;
    readonly COTURN_MIN_PORT: 49152;
    readonly COTURN_MAX_PORT: 65535;
};
export declare const NODE_STATUS: {
    readonly HEALTHY: "healthy";
    readonly DEGRADED: "degraded";
    readonly UNHEALTHY: "unhealthy";
};
export declare const PROCESS_STATUS: {
    readonly RUNNING: "running";
    readonly STOPPED: "stopped";
    readonly STARTING: "starting";
    readonly STOPPING: "stopping";
    readonly ERROR: "error";
};
export declare const LOG_LEVELS: {
    readonly DEBUG: "debug";
    readonly INFO: "info";
    readonly WARN: "warn";
    readonly ERROR: "error";
};
