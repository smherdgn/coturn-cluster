"use strict";
// ========================================
// COTURN CLUSTER PUB/SUB MESSAGE INTERFACE
// shared/src/messages.ts
// ========================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFromNode = exports.isFromAdmin = exports.isTargetedToMe = exports.createMessage = exports.validateNodeRegister = exports.validateConfigUpdate = exports.validateUserAdd = exports.validateMessage = exports.CHANNELS = void 0;
// ========================================
// CHANNEL CONSTANTS
// ========================================
exports.CHANNELS = {
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
};
// ========================================
// VALIDATION FUNCTIONS
// ========================================
const validateMessage = (message) => {
    return !!(message &&
        typeof message === 'object' &&
        message.id &&
        message.timestamp &&
        message.source &&
        message.channel &&
        message.data);
};
exports.validateMessage = validateMessage;
const validateUserAdd = (data) => {
    return !!(data &&
        data.username &&
        data.password &&
        data.realm);
};
exports.validateUserAdd = validateUserAdd;
const validateConfigUpdate = (data) => {
    return !!(data &&
        data.type &&
        data.config &&
        typeof data.config === 'object');
};
exports.validateConfigUpdate = validateConfigUpdate;
const validateNodeRegister = (data) => {
    return !!(data &&
        data.nodeId &&
        data.ip &&
        data.ports &&
        data.capabilities &&
        Array.isArray(data.capabilities) &&
        data.version &&
        data.agentVersion);
};
exports.validateNodeRegister = validateNodeRegister;
// ========================================
// UTILITY FUNCTIONS
// ========================================
const createMessage = (channel, data, source, target = 'all') => {
    return {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        source,
        target,
        channel,
        data
    };
};
exports.createMessage = createMessage;
const isTargetedToMe = (message, myId) => {
    return message.target === 'all' || message.target === myId;
};
exports.isTargetedToMe = isTargetedToMe;
const isFromAdmin = (message) => {
    return message.source === 'admin';
};
exports.isFromAdmin = isFromAdmin;
const isFromNode = (message) => {
    return message.source !== 'admin';
};
exports.isFromNode = isFromNode;
//# sourceMappingURL=messages.js.map