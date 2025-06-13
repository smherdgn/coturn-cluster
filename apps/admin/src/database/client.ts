import { Pool, PoolClient } from 'pg';
import { databaseConfig, DATABASE_URL } from '../config/environment';

class DatabaseClient {
  private pool: Pool;
  private isConnected: boolean = false;

  constructor() {
    this.pool = new Pool({
      connectionString: DATABASE_URL,
      min: databaseConfig.poolMin,
      max: databaseConfig.poolMax,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    this.pool.on('connect', () => {
      console.log('🔌 New database client connected');
    });

    this.pool.on('error', (err) => {
      console.error('❌ Database pool error:', err);
    });
  }

  async connect(): Promise<void> {
    try {
      console.log('🔌 Connecting to database...');
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      this.isConnected = true;
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async query(text: string, params?: any[]): Promise<any> {
    if (!this.isConnected) {
      await this.connect();
    }
    
    try {
      const result = await this.pool.query(text, params);
      return result;
    } catch (error) {
      console.error('❌ Database query error:', error);
      throw error;
    }
  }

  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  async close(): Promise<void> {
    await this.pool.end();
    this.isConnected = false;
    console.log('🔌 Database connection closed');
  }
}

export const db = new DatabaseClient();
