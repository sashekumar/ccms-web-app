/**
 * Logger Utility - Production-grade logging with environment-aware levels
 * 
 * Log Levels:
 * - DEBUG (0): Detailed diagnostic information
 * - INFO (1): Informational messages
 * - WARN (2): Warning messages
 * - ERROR (3): Error messages
 * 
 * Environment Behavior:
 * - Production: ERROR level only (minimal logging)
 * - Development: DEBUG level (all logs)
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    // In production, only log ERROR level
    // In development, log everything (DEBUG level)
    this.logLevel = process.env.NODE_ENV === 'production' 
      ? LogLevel.ERROR 
      : LogLevel.DEBUG;
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${this.getTimestamp()} ${message}`, ...args);
    }
  }

  /**
   * Log info message (only in development)
   */
  info(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.INFO) {
      console.log(`[INFO] ${this.getTimestamp()} ${message}`, ...args);
    }
  }

  /**
   * Log warning message (only in development)
   */
  warn(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.WARN) {
      console.warn(`[WARN] ${this.getTimestamp()} ${message}`, ...args);
    }
  }

  /**
   * Log error message (always logged in production and development)
   */
  error(message: string, error?: any): void {
    if (this.logLevel <= LogLevel.ERROR) {
      console.error(`[ERROR] ${this.getTimestamp()} ${message}`, error || '');
    }
  }

  /**
   * Get current timestamp in ISO format
   */
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Set log level programmatically (useful for testing)
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Get current log level
   */
  getLogLevel(): LogLevel {
    return this.logLevel;
  }
}

// Export singleton instance
export const logger = new Logger();
