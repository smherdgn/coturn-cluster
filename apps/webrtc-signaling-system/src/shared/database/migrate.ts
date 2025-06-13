import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { config } from '../config';
import { logger } from '../utils/logger';

async function runMigrations(): Promise<void> {
  logger.info('Starting database migrations...');
  
  try {
    // Create migration client
    const migrationClient = postgres(config.database.url, {
      max: 1,
      prepare: false,
    });

    const db = drizzle(migrationClient, { logger: true });

    // Run migrations
    await migrate(db, { 
      migrationsFolder: './drizzle',
      migrationsTable: 'drizzle_migrations',
    });

    logger.info('✅ Migrations completed successfully');
    
    // Close connection
    await migrationClient.end();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

export { runMigrations };
