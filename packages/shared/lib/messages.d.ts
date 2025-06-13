export interface BaseMessage {
    id: string;
    timestamp: string;
    source: string;
    target: string;
    channel: string;
    data: any;
}
export interface UserAddMessage extends BaseMessage {
    channel: 'user.add';
    data: {
        username: string;
        password: string;
        realm: string;
        quota?: number;
        bandwidth?: number;
        expires?: string;
    };
}
export interface UserDeleteMessage extends BaseMessage {
    channel: 'user.delete';
    data: {
        username: string;
        realm: string;
    };
}
export interface UserUpdateMessage extends BaseMessage {
    channel: 'user.update';
    data: {
        username: string;
        changes: {
            password?: string;
            quota?: number;
            bandwidth?: number;
            expires?: string;
        };
    };
}
export interface UserResultMessage extends BaseMessage {
    channel: 'user.result';
    data: {
        operation: 'add' | 'delete' | 'update';
        username: string;
        success: boolean;
        error?: string;
        nodeId: string;
    };
}
export interface ConfigUpdateMessage extends BaseMessage {
    channel: 'config.update';
    data: {
        type: 'global' | 'network' | 'auth' | 'limits' | 'logging';
        config: Record<string, any>;
    };
}
export interface ConfigNodeUpdateMessage extends BaseMessage {
    channel: 'config.node.update';
    data: {
        nodeId: string;
        config: Record<string, any>;
    };
}
export interface ConfigResultMessage extends BaseMessage {
    channel: 'config.result';
    data: {
        type: string;
        success: boolean;
        error?: string;
        nodeId: string;
        appliedAt: string;
    };
}
export interface ProcessControlMessage extends BaseMessage {
    channel: 'process.control';
    data: {
        action: 'start' | 'stop' | 'restart' | 'reload' | 'status';
        graceful?: boolean;
        timeout?: number;
    };
}
export interface ProcessStatusMessage extends BaseMessage {
    channel: 'process.status';
    data: {
        nodeId: string;
        status: 'running' | 'stopped' | 'starting' | 'stopping' | 'error';
        pid?: number;
        uptime?: number;
        restartCount?: number;
        lastRestart?: string;
    };
}
export interface NodeRegisterMessage extends BaseMessage {
    channel: 'node.register';
    data: {
        nodeId: string;
        podName?: string;
        ip: string;
        ports: {
            turn: number;
            turns: number;
            agent: number;
        };
        capabilities: string[];
        version: string;
        agentVersion: string;
        resources: {
            cpu: string;
            memory: string;
        };
    };
}
export interface NodeHeartbeatMessage extends BaseMessage {
    channel: 'node.heartbeat';
    data: {
        nodeId: string;
        status: 'healthy' | 'degraded' | 'unhealthy';
        timestamp: string;
        uptime: number;
    };
}
export interface NodeHealthCheckMessage extends BaseMessage {
    channel: 'node.health.check';
    data: {
        timeout?: number;
    };
}
export interface NodeDisconnectMessage extends BaseMessage {
    channel: 'node.disconnect';
    data: {
        nodeId: string;
        reason: 'shutdown' | 'error' | 'network';
        graceful: boolean;
    };
}
export interface StatsReportMessage extends BaseMessage {
    channel: 'stats.report';
    data: {
        nodeId: string;
        timestamp: string;
        connections: {
            active: number;
            total: number;
            byProtocol: {
                udp: number;
                tcp: number;
                tls: number;
            };
        };
        bandwidth: {
            inbound: number;
            outbound: number;
            total: number;
        };
        resources: {
            cpu: number;
            memory: number;
            disk: number;
        };
        sessions: {
            active: number;
            peak: number;
            avgDuration: number;
        };
        errors: {
            authFailures: number;
            timeouts: number;
            networkErrors: number;
        };
    };
}
export interface StatsRequestMessage extends BaseMessage {
    channel: 'stats.request';
    data: {
        type: 'current' | 'historical' | 'detailed';
        timeRange?: {
            start: string;
            end: string;
        };
    };
}
export interface LogStreamMessage extends BaseMessage {
    channel: 'log.stream';
    data: {
        nodeId: string;
        level: 'debug' | 'info' | 'warn' | 'error';
        timestamp: string;
        component: 'coturn' | 'agent';
        message: string;
        metadata?: Record<string, any>;
    };
}
export interface LogLevelChangeMessage extends BaseMessage {
    channel: 'log.level.change';
    data: {
        level: 'debug' | 'info' | 'warn' | 'error';
        component: 'coturn' | 'agent' | 'all';
    };
}
export interface CertUpdateMessage extends BaseMessage {
    channel: 'cert.update';
    data: {
        type: 'tls' | 'dtls';
        cert: string;
        key: string;
        ca?: string;
        expiresAt: string;
    };
}
export interface CertStatusMessage extends BaseMessage {
    channel: 'cert.status';
    data: {
        nodeId: string;
        type: 'tls' | 'dtls';
        valid: boolean;
        expiresAt: string;
        daysUntilExpiry: number;
    };
}
export interface LoadBalancerUpdateMessage extends BaseMessage {
    channel: 'lb.update.upstream';
    data: {
        action: 'add' | 'remove' | 'update';
        nodes: Array<{
            nodeId: string;
            ip: string;
            port: number;
            weight: number;
            backup: boolean;
        }>;
    };
}
export interface LoadMetricsMessage extends BaseMessage {
    channel: 'load.metrics';
    data: {
        nodeId: string;
        timestamp: string;
        currentLoad: number;
        maxCapacity: number;
        currentConnections: number;
        queueLength: number;
        avgResponseTime: number;
    };
}
export interface MaintenanceModeMessage extends BaseMessage {
    channel: 'maintenance.mode';
    data: {
        enabled: boolean;
        reason: string;
        drainConnections: boolean;
        estimatedDuration: number;
    };
}
export interface EmergencyShutdownMessage extends BaseMessage {
    channel: 'emergency.shutdown';
    data: {
        reason: string;
        immediate: boolean;
        message: string;
    };
}
export type PubSubMessage = UserAddMessage | UserDeleteMessage | UserUpdateMessage | UserResultMessage | ConfigUpdateMessage | ConfigNodeUpdateMessage | ConfigResultMessage | ProcessControlMessage | ProcessStatusMessage | NodeRegisterMessage | NodeHeartbeatMessage | NodeHealthCheckMessage | NodeDisconnectMessage | StatsReportMessage | StatsRequestMessage | LogStreamMessage | LogLevelChangeMessage | CertUpdateMessage | CertStatusMessage | LoadBalancerUpdateMessage | LoadMetricsMessage | MaintenanceModeMessage | EmergencyShutdownMessage;
export declare const CHANNELS: {
    readonly USER_ADD: "user.add";
    readonly USER_DELETE: "user.delete";
    readonly USER_UPDATE: "user.update";
    readonly USER_RESULT: "user.result";
    readonly CONFIG_UPDATE: "config.update";
    readonly CONFIG_NODE_UPDATE: "config.node.update";
    readonly CONFIG_RESULT: "config.result";
    readonly PROCESS_CONTROL: "process.control";
    readonly PROCESS_STATUS: "process.status";
    readonly NODE_REGISTER: "node.register";
    readonly NODE_HEARTBEAT: "node.heartbeat";
    readonly NODE_HEALTH_CHECK: "node.health.check";
    readonly NODE_DISCONNECT: "node.disconnect";
    readonly STATS_REPORT: "stats.report";
    readonly STATS_REQUEST: "stats.request";
    readonly LOG_STREAM: "log.stream";
    readonly LOG_LEVEL_CHANGE: "log.level.change";
    readonly CERT_UPDATE: "cert.update";
    readonly CERT_STATUS: "cert.status";
    readonly LB_UPDATE_UPSTREAM: "lb.update.upstream";
    readonly LOAD_METRICS: "load.metrics";
    readonly MAINTENANCE_MODE: "maintenance.mode";
    readonly EMERGENCY_SHUTDOWN: "emergency.shutdown";
};
export declare const validateMessage: (message: any) => message is BaseMessage;
export declare const validateUserAdd: (data: any) => data is UserAddMessage["data"];
export declare const validateConfigUpdate: (data: any) => data is ConfigUpdateMessage["data"];
export declare const validateNodeRegister: (data: any) => data is NodeRegisterMessage["data"];
export declare const createMessage: <T extends PubSubMessage>(channel: T["channel"], data: T["data"], source: string, target?: string) => T;
export declare const isTargetedToMe: (message: BaseMessage, myId: string) => boolean;
export declare const isFromAdmin: (message: BaseMessage) => boolean;
export declare const isFromNode: (message: BaseMessage) => boolean;
