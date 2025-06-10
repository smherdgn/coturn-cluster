"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateWithSchema = exports.nodeRegisterSchema = exports.configUpdateSchema = exports.userAddSchema = exports.baseMessageSchema = void 0;
// shared/src/schemas.ts
const joi_1 = __importDefault(require("joi"));
exports.baseMessageSchema = joi_1.default.object({
    id: joi_1.default.string().required(),
    timestamp: joi_1.default.string().isoDate().required(),
    source: joi_1.default.string().required(),
    target: joi_1.default.string().required(),
    channel: joi_1.default.string().required(),
    data: joi_1.default.object().required()
});
exports.userAddSchema = joi_1.default.object({
    username: joi_1.default.string().alphanum().min(3).max(30).required(),
    password: joi_1.default.string().min(6).required(),
    realm: joi_1.default.string().domain().required(),
    quota: joi_1.default.number().integer().min(0).optional(),
    bandwidth: joi_1.default.number().integer().min(0).optional(),
    expires: joi_1.default.string().isoDate().optional()
});
exports.configUpdateSchema = joi_1.default.object({
    type: joi_1.default.string().valid('global', 'network', 'auth', 'limits', 'logging').required(),
    config: joi_1.default.object().required()
});
exports.nodeRegisterSchema = joi_1.default.object({
    nodeId: joi_1.default.string().required(),
    podName: joi_1.default.string().optional(),
    ip: joi_1.default.string().ip().required(),
    ports: joi_1.default.object({
        turn: joi_1.default.number().integer().min(1).max(65535).required(),
        turns: joi_1.default.number().integer().min(1).max(65535).required(),
        agent: joi_1.default.number().integer().min(1).max(65535).required()
    }).required(),
    capabilities: joi_1.default.array().items(joi_1.default.string()).required(),
    version: joi_1.default.string().required(),
    agentVersion: joi_1.default.string().required(),
    resources: joi_1.default.object({
        cpu: joi_1.default.string().required(),
        memory: joi_1.default.string().required()
    }).required()
});
const validateWithSchema = (message, schema) => {
    const { error, value } = schema.validate(message);
    if (error) {
        throw new Error(`Validation error: ${error.details[0].message}`);
    }
    return value;
};
exports.validateWithSchema = validateWithSchema;
//# sourceMappingURL=schemas.js.map