import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
  poolMin: number;
  poolMax: number;
}

export interface ServerConfig {
  nodeEnv: string;
  pubsubPort: number;
  apiPort: number;
  dashboardPort: number;
  jwtSecret: string;
  corsOrigin: string;
  logLevel: string;
}

function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name] || defaultValue;
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

function getEnvNumber(name: string, defaultValue?: number): number {
  const value = process.env[name];
  if (!value) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Required environment variable ${name} is not set`);
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(
      `Environment variable ${name} must be a number, got: ${value}`
    );
  }
  return parsed;
}

function getEnvBoolean(name: string, defaultValue?: boolean): boolean {
  const value = process.env[name];
  if (!value) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value.toLowerCase() === "true";
}

export const databaseConfig: DatabaseConfig = {
  host: getEnvVar("POSTGRES_HOST", "localhost"),
  port: getEnvNumber("POSTGRES_PORT", 5432),
  database: getEnvVar("POSTGRES_DB", "coturn_cluster"),
  user: getEnvVar("POSTGRES_USER", "coturn_admin"),
  password: getEnvVar("POSTGRES_PASSWORD"),
  ssl: getEnvBoolean("POSTGRES_SSL", false),
  poolMin: getEnvNumber("POSTGRES_POOL_MIN", 2),
  poolMax: getEnvNumber("POSTGRES_POOL_MAX", 10),
};

export const serverConfig: ServerConfig = {
  nodeEnv: getEnvVar("NODE_ENV", "development"),
  pubsubPort: getEnvNumber("ADMIN_PUBSUB_PORT", 9001),
  apiPort: getEnvNumber("ADMIN_API_PORT", 8081),
  dashboardPort: getEnvNumber("ADMIN_DASHBOARD_PORT", 3000),
  jwtSecret: getEnvVar("JWT_SECRET"),
  corsOrigin: getEnvVar("CORS_ORIGIN", "*"),
  logLevel: getEnvVar("LOG_LEVEL", "info"),
};

export const buildConnectionString = (config: DatabaseConfig): string => {
  const ssl = config.ssl ? "?sslmode=require" : "";
  return `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}${ssl}`;
};

export const DATABASE_URL = buildConnectionString(databaseConfig);

export const validateEnvironment = (): void => {
  console.log("🔍 Validating environment configuration...");

  try {
    console.log("📊 Database Config:", {
      host: databaseConfig.host,
      port: databaseConfig.port,
      database: databaseConfig.database,
      user: databaseConfig.user,
      ssl: databaseConfig.ssl,
    });

    console.log("✅ Environment validation successful");
  } catch (error) {
    console.error("❌ Environment validation failed:", error);
    process.exit(1);
  }
};
