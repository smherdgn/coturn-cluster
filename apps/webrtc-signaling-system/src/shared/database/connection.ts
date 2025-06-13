import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { config } from '../config';
import { logger } from '../utils/logger';

// Create postgres client
const client = postgres(config.database.url, {
  max: config.database.maxConnections,
  idle_timeout: config.database.idleTimeout,
  connect_timeout: config.database.connectTimeout,
  prepare: false,
  onnotice: (notice) => {
    if (config.env === 'development') {
      logger.debug('PostgreSQL notice:', notice);
    }
  },
  debug: config.env === 'development' ? (connection, query, parameters) => {
    logger.debug('PostgreSQL query:', { connection, query, parameters });
  } : false,
});

// Create drizzle instance
export const db = drizzle(client, { 
  schema,
  logger: config.env === 'development'
});

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    logger.info('Database connection is healthy');
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await client.end();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
}

// Connection event handlers
process.on('SIGINT', closeDatabaseConnection);
process.on('SIGTERM', closeDatabaseConnection);
process.on('beforeExit', closeDatabaseConnection);
