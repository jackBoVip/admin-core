/**
 * Logger utility for layout package
 * @description Configurable logging with log levels and optional prefix
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

/** Log level priorities */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

/** Logger configuration */
interface LoggerConfig {
  /** Minimum log level to output */
  level: LogLevel;
  /** Prefix for all log messages */
  prefix: string;
  /** Enable/disable logging */
  enabled: boolean;
}

/** Default configuration */
const DEFAULT_CONFIG: LoggerConfig = {
  level: typeof process !== 'undefined' && process.env?.NODE_ENV === 'production' ? 'warn' : 'debug',
  prefix: '[Layout]',
  enabled: true,
};

/** Current configuration */
let config: LoggerConfig = { ...DEFAULT_CONFIG };

/**
 * Check if a log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  if (!config.enabled) return false;
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[config.level];
}

/**
 * Format log arguments with prefix
 */
function formatArgs(args: unknown[]): unknown[] {
  if (config.prefix) {
    return [config.prefix, ...args];
  }
  return args;
}

/**
 * Logger instance
 */
export const logger = {
  /**
   * Configure the logger
   */
  configure(options: Partial<LoggerConfig>): void {
    config = { ...config, ...options };
  },

  /**
   * Reset to default configuration
   */
  reset(): void {
    config = { ...DEFAULT_CONFIG };
  },

  /**
   * Get current configuration
   */
  getConfig(): Readonly<LoggerConfig> {
    return { ...config };
  },

  /**
   * Debug level logging
   */
  debug(...args: unknown[]): void {
    if (shouldLog('debug')) {
      // eslint-disable-next-line no-console -- logger API
      console.debug(...formatArgs(args));
    }
  },

  /**
   * Info level logging
   */
  info(...args: unknown[]): void {
    if (shouldLog('info')) {
      // eslint-disable-next-line no-console -- logger API
      console.info(...formatArgs(args));
    }
  },

  /**
   * Warning level logging
   */
  warn(...args: unknown[]): void {
    if (shouldLog('warn')) {
      console.warn(...formatArgs(args));
    }
  },

  /**
   * Error level logging
   */
  error(...args: unknown[]): void {
    if (shouldLog('error')) {
      console.error(...formatArgs(args));
    }
  },
};

export default logger;
