"use strict";
// shared/src/constants.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOG_LEVELS = exports.PROCESS_STATUS = exports.NODE_STATUS = exports.DEFAULT_PORTS = void 0;
exports.DEFAULT_PORTS = {
    ADMIN_API: 8080,
    ADMIN_DASHBOARD: 3000,
    ADMIN_PUBSUB: 9001,
    COTURN_TURN: 3478,
    COTURN_TURNS: 5349,
    COTURN_AGENT: 8080,
    COTURN_MIN_PORT: 49152,
    COTURN_MAX_PORT: 65535
};
exports.NODE_STATUS = {
    HEALTHY: 'healthy',
    DEGRADED: 'degraded',
    UNHEALTHY: 'unhealthy'
};
exports.PROCESS_STATUS = {
    RUNNING: 'running',
    STOPPED: 'stopped',
    STARTING: 'starting',
    STOPPING: 'stopping',
    ERROR: 'error'
};
exports.LOG_LEVELS = {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
};
