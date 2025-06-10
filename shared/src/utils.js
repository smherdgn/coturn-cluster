"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringifyMessage = exports.parseMessage = exports.sleep = exports.createBaseMessage = exports.getCurrentTimestamp = exports.generateId = void 0;
// shared/src/utils.ts
const uuid_1 = require("uuid");
const generateId = () => (0, uuid_1.v4)();
exports.generateId = generateId;
const getCurrentTimestamp = () => new Date().toISOString();
exports.getCurrentTimestamp = getCurrentTimestamp;
const createBaseMessage = (channel, data, source, target = 'all') => ({
    id: (0, exports.generateId)(),
    timestamp: (0, exports.getCurrentTimestamp)(),
    source,
    target,
    channel,
    data
});
exports.createBaseMessage = createBaseMessage;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
exports.sleep = sleep;
const parseMessage = (data) => {
    try {
        return JSON.parse(data);
    }
    catch (error) {
        throw new Error(`Invalid JSON message: ${error}`);
    }
};
exports.parseMessage = parseMessage;
const stringifyMessage = (message) => {
    try {
        return JSON.stringify(message);
    }
    catch (error) {
        throw new Error(`Failed to stringify message: ${error}`);
    }
};
exports.stringifyMessage = stringifyMessage;
//# sourceMappingURL=utils.js.map