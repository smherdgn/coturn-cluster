import { db } from "../../database/client";
// import { redisClient } from '../../services/redis.service'; // for Redis

export const getDatabaseStatus = async () => {
  try {
    const result = await db.query("SELECT version()");
    return {
      status: "healthy",
      provider: "PostgreSQL",
      version: result.rows[0].version,
    };
  } catch (error: any) {
    return {
      status: "unhealthy",
      provider: "PostgreSQL",
      error: error.message,
    };
  }
};

export const getRedisStatus = async () => {
  // TODO(Soner): Redis connerction add
  try {
    // await redisClient.ping();
    return {
      status: "healthy",
      provider: "Redis",
      version: "7.0", // await redisClient.info('server')).redis_version
    };
  } catch (error: any) {
    return {
      status: "unhealthy",
      provider: "Redis",
      error: error.message,
    };
  }
};
