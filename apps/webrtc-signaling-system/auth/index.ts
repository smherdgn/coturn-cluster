import type { FastifyInstance } from 'fastify';
import authRoutes from './routes/auth.routes';
import { logger } from '../shared/utils/logger';

export default async function authPlugin(fastify: FastifyInstance) {
  logger.info('Registering auth plugin');
  
  // Register auth routes with prefix
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  
  logger.info('Auth plugin registered successfully');
}

