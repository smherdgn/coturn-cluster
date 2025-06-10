// shared/src/constants.ts

export const DEFAULT_PORTS = {
    ADMIN_API: 8080,
    ADMIN_DASHBOARD: 3000,
    ADMIN_PUBSUB: 9001,
    COTURN_TURN: 3478,
    COTURN_TURNS: 5349,
    COTURN_AGENT: 8080,
    COTURN_MIN_PORT: 49152,
    COTURN_MAX_PORT: 65535
  } as const;
  
  export const NODE_STATUS = {
    HEALTHY: 'healthy',
    DEGRADED: 'degraded',
    UNHEALTHY: 'unhealthy'
  } as const;
  
  export const PROCESS_STATUS = {
    RUNNING: 'running',
    STOPPED: 'stopped',
    STARTING: 'starting',
    STOPPING: 'stopping',
    ERROR: 'error'
  } as const;
  
  export const LOG_LEVELS = {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
  } as const;