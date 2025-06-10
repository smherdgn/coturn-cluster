// Re-export everything from existing modules
export * from './constants';
export * from './messages';
export * from './schemas';
export * from './utils';

// Export new service discovery modules
export { ServiceRegistry } from './ServiceRegistry';
export { EnvConfigManager, envConfig } from './EnvConfig';
