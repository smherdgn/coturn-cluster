// ========================================
// COTURN CLUSTER PUB/SUB MESSAGE INTERFACE
// shared/src/messages.ts
// ========================================

export interface BaseMessage {
    id: string;
    timestamp: string;
    source: string; // "admin" | node-id
    target: string; // "all" | node-id | "admin"
    channel: string;
    data: any;
  }
  
  // ========================================
  // 1. USER MANAGEMENT MESSAGES
  // ========================================
  
  export interface UserAddMessage extends BaseMessage {
    channel: 'user.add';
    data: {
      username: string;
      password: string;
      realm: string;
      quota?: number; // MB
      bandwidth?: number; // bps
      expires?: string; // ISO date
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
  
  // ========================================
  // 2. CONFIG MANAGEMENT MESSAGES
  // ========================================
  
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
  
  // ========================================
  // 3. PROCESS MANAGEMENT MESSAGES
  // ========================================
  
  export interface ProcessControlMessage extends BaseMessage {
    channel: 'process.control';
    data: {
      action: 'start' | 'stop' | 'restart' | 'reload' | 'status';
      graceful?: boolean;
      timeout?: number; // seconds
    };
  }
  
  export interface ProcessStatusMessage extends BaseMessage {
    channel: 'process.status';
    data: {
      nodeId: string;
      status: 'running' | 'stopped' | 'starting' | 'stopping' | 'error';
      pid?: number;
      uptime?: number; // seconds
      restartCount?: number;
      lastRestart?: string;
    };
  }
  
  // ========================================
  // 4. NODE MANAGEMENT MESSAGES
  // ========================================
  
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
      timeout?: number; // seconds
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
  
  // ========================================
  // 5. MONITORING & STATS MESSAGES
  // ========================================
  
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
        inbound: number; // bytes/sec
        outbound: number;
        total: number;
      };
      resources: {
        cpu: number; // percentage
        memory: number; // percentage
        disk: number;
      };
      sessions: {
        active: number;
        peak: number;
        avgDuration: number; // seconds
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
  
  // ========================================
  // 6. LOGGING MESSAGES
  // ========================================
  
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
  
  // ========================================
  // 7. SECURITY & CERTIFICATES MESSAGES
  // ========================================
  
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
  
  // ========================================
  // 8. SCALING & LOAD BALANCING MESSAGES
  // ========================================
  
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
      currentLoad: number; // percentage
      maxCapacity: number; // max connections
      currentConnections: number;
      queueLength: number;
      avgResponseTime: number; // ms
    };
  }
  
  // ========================================
  // 9. ADMINISTRATION MESSAGES
  // ========================================
  
  export interface MaintenanceModeMessage extends BaseMessage {
    channel: 'maintenance.mode';
    data: {
      enabled: boolean;
      reason: string;
      drainConnections: boolean;
      estimatedDuration: number; // seconds
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
  
  // ========================================
  // MESSAGE TYPE UNION
  // ========================================
  
  export type PubSubMessage = 
    | UserAddMessage
    | UserDeleteMessage
    | UserUpdateMessage
    | UserResultMessage
    | ConfigUpdateMessage
    | ConfigNodeUpdateMessage
    | ConfigResultMessage
    | ProcessControlMessage
    | ProcessStatusMessage
    | NodeRegisterMessage
    | NodeHeartbeatMessage
    | NodeHealthCheckMessage
    | NodeDisconnectMessage
    | StatsReportMessage
    | StatsRequestMessage
    | LogStreamMessage
    | LogLevelChangeMessage
    | CertUpdateMessage
    | CertStatusMessage
    | LoadBalancerUpdateMessage
    | LoadMetricsMessage
    | MaintenanceModeMessage
    | EmergencyShutdownMessage;
  
  // ========================================
  // CHANNEL CONSTANTS
  // ========================================
  
  export const CHANNELS = {
    // User Management
    USER_ADD: 'user.add',
    USER_DELETE: 'user.delete',
    USER_UPDATE: 'user.update',
    USER_RESULT: 'user.result',
    
    // Config Management
    CONFIG_UPDATE: 'config.update',
    CONFIG_NODE_UPDATE: 'config.node.update',
    CONFIG_RESULT: 'config.result',
    
    // Process Management
    PROCESS_CONTROL: 'process.control',
    PROCESS_STATUS: 'process.status',
    
    // Node Management
    NODE_REGISTER: 'node.register',
    NODE_HEARTBEAT: 'node.heartbeat',
    NODE_HEALTH_CHECK: 'node.health.check',
    NODE_DISCONNECT: 'node.disconnect',
    
    // Monitoring & Stats
    STATS_REPORT: 'stats.report',
    STATS_REQUEST: 'stats.request',
    
    // Logging
    LOG_STREAM: 'log.stream',
    LOG_LEVEL_CHANGE: 'log.level.change',
    
    // Security
    CERT_UPDATE: 'cert.update',
    CERT_STATUS: 'cert.status',
    
    // Scaling
    LB_UPDATE_UPSTREAM: 'lb.update.upstream',
    LOAD_METRICS: 'load.metrics',
    
    // Administration
    MAINTENANCE_MODE: 'maintenance.mode',
    EMERGENCY_SHUTDOWN: 'emergency.shutdown'
  } as const;
  
  // ========================================
  // VALIDATION FUNCTIONS
  // ========================================
  
  export const validateMessage = (message: any): message is BaseMessage => {
    return !!(
      message &&
      typeof message === 'object' &&
      message.id &&
      message.timestamp &&
      message.source &&
      message.channel &&
      message.data
    );
  };
  
  export const validateUserAdd = (data: any): data is UserAddMessage['data'] => {
    return !!(
      data &&
      data.username &&
      data.password &&
      data.realm
    );
  };
  
  export const validateConfigUpdate = (data: any): data is ConfigUpdateMessage['data'] => {
    return !!(
      data &&
      data.type &&
      data.config &&
      typeof data.config === 'object'
    );
  };
  
  export const validateNodeRegister = (data: any): data is NodeRegisterMessage['data'] => {
    return !!(
      data &&
      data.nodeId &&
      data.ip &&
      data.ports &&
      data.capabilities &&
      Array.isArray(data.capabilities) &&
      data.version &&
      data.agentVersion
    );
  };
  
  // ========================================
  // UTILITY FUNCTIONS
  // ========================================
  
  export const createMessage = <T extends PubSubMessage>(
    channel: T['channel'],
    data: T['data'],
    source: string,
    target: string = 'all'
  ): T => {
    return {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      source,
      target,
      channel,
      data
    } as T;
  };
  
  export const isTargetedToMe = (message: BaseMessage, myId: string): boolean => {
    return message.target === 'all' || message.target === myId;
  };
  
  export const isFromAdmin = (message: BaseMessage): boolean => {
    return message.source === 'admin';
  };
  
  export const isFromNode = (message: BaseMessage): boolean => {
    return message.source !== 'admin';
  };