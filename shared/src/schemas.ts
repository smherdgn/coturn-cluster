// shared/src/schemas.ts
import Joi from 'joi';

export const baseMessageSchema = Joi.object({
  id: Joi.string().required(),
  timestamp: Joi.string().isoDate().required(),
  source: Joi.string().required(),
  target: Joi.string().required(),
  channel: Joi.string().required(),
  data: Joi.object().required()
});

export const userAddSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(6).required(),
  realm: Joi.string().domain().required(),
  quota: Joi.number().integer().min(0).optional(),
  bandwidth: Joi.number().integer().min(0).optional(),
  expires: Joi.string().isoDate().optional()
});

export const configUpdateSchema = Joi.object({
  type: Joi.string().valid('global', 'network', 'auth', 'limits', 'logging').required(),
  config: Joi.object().required()
});

export const nodeRegisterSchema = Joi.object({
  nodeId: Joi.string().required(),
  podName: Joi.string().optional(),
  ip: Joi.string().ip().required(),
  ports: Joi.object({
    turn: Joi.number().integer().min(1).max(65535).required(),
    turns: Joi.number().integer().min(1).max(65535).required(),
    agent: Joi.number().integer().min(1).max(65535).required()
  }).required(),
  capabilities: Joi.array().items(Joi.string()).required(),
  version: Joi.string().required(),
  agentVersion: Joi.string().required(),
  resources: Joi.object({
    cpu: Joi.string().required(),
    memory: Joi.string().required()
  }).required()
});

export const validateWithSchema = (message: any, schema: Joi.ObjectSchema) => {
  const { error, value } = schema.validate(message);
  if (error) {
    throw new Error(`Validation error: ${error.details[0].message}`);
  }
  return value;
};