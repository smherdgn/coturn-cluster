import winston from 'winston';
import { config } from '../config';

// Custom log levels
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
  },
};

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logMessage = `${timestamp} [${level}]: ${message}`;
    
    // Add stack trace for errors
    if (stack) {
      logMessage += `\n${stack}`;
    }
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return logMessage;
  })
);

// File log format (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    level: config.logging.level,
    format: logFormat,
  }),
];

// Add file transport if not in test environment
if (config.env !== 'test') {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
      filename: config.logging.file,
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  levels: customLevels.levels,
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true })
  ),
  transports,
  exitOnError: false,
});

// Add colors to winston
winston.addColors(customLevels.colors);

// Enhanced logging methods
export class Logger {
  private context: string | undefined;

  constructor(context?: string) {
    this.context = context;
  }

  private formatMessage(message: string): string {
    return this.context ? `[${this.context}] ${message}` : message;
  }

  error(message: string, error?: Error | any, meta?: any): void {
    const logMeta = { ...meta };
    if (error) {
      if (error instanceof Error) {
        logMeta.error = {
          message: error.message,
          stack: error.stack,
          name: error.name,
        };
      } else {
        logMeta.error = error;
      }
    }
    logger.error(this.formatMessage(message), logMeta);
  }

  warn(message: string, meta?: any): void {
    logger.warn(this.formatMessage(message), meta);
  }

  info(message: string, meta?: any): void {
    logger.info(this.formatMessage(message), meta);
  }

  debug(message: string, meta?: any): void {
    logger.debug(this.formatMessage(message), meta);
  }

  // HTTP request logging
  http(method: string, url: string, statusCode: number, responseTime: number, meta?: any): void {
    const logLevel = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';
    const message = `${method} ${url} ${statusCode} - ${responseTime}ms`;
    
    logger.log(logLevel, this.formatMessage(message), {
      method,
      url,
      statusCode,
      responseTime,
      ...meta,
    });
  }

  // Database operation logging
  db(operation: string, table: string, duration: number, meta?: any): void {
    this.debug(`DB ${operation} on ${table} completed in ${duration}ms`, {
      operation,
      table,
      duration,
      ...meta,
    });
  }

  // WebSocket event logging
  socket(event: string, socketId: string, userId?: string, meta?: any): void {
    this.debug(`Socket event: ${event}`, {
      event,
      socketId,
      userId,
      ...meta,
    });
  }

  // Authentication logging
  auth(action: string, userId?: string, success = true, meta?: any): void {
    const level = success ? 'info' : 'warn';
    const message = `Auth ${action} ${success ? 'succeeded' : 'failed'}`;
    
    logger.log(level, this.formatMessage(message), {
      action,
      userId,
      success,
      ...meta,
    });
  }

  // Performance logging
  performance(operation: string, duration: number, meta?: any): void {
    const level = duration > 1000 ? 'warn' : 'debug';
    this.log(level, `Performance: ${operation} took ${duration}ms`, {
      operation,
      duration,
      ...meta,
    });
  }

  private log(level: string, message: string, meta?: any): void {
    logger.log(level, this.formatMessage(message), meta);
  }
}

// Create default logger instance
export const defaultLogger = new Logger();

// Export convenience methods
export const logError = (message: string, error?: Error | any, meta?: any) => 
  defaultLogger.error(message, error, meta);

export const logWarn = (message: string, meta?: any) => 
  defaultLogger.warn(message, meta);

export const logInfo = (message: string, meta?: any) => 
  defaultLogger.info(message, meta);

export const logDebug = (message: string, meta?: any) => 
  defaultLogger.debug(message, meta);

// Request logging middleware helper
export const createRequestLogger = (context: string) => new Logger(context);

// Stream for Morgan HTTP logging
export const httpLogStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Handle uncaught exceptions and unhandled rejections
if (config.env === 'production') {
  logger.exceptions.handle(
    new winston.transports.File({ 
      filename: 'logs/exceptions.log',
      format: fileFormat,
    })
  );

  logger.rejections.handle(
    new winston.transports.File({ 
      filename: 'logs/rejections.log',
      format: fileFormat,
    })
  );
}

// Log startup information
if (config.env !== 'test') {
  logger.info('Logger initialized', {
    level: config.logging.level,
    environment: config.env,
    logFile: config.logging.file,
  });
}
