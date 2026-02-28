import { createLeveledLogger, type LoggerLevel, type LoggerMode } from '@admin-core/shared-core';

export type LogLevel = LoggerLevel;
export type { LoggerMode };

export type Logger = {
  error: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
};

const DEFAULT_LOG_LEVEL: LoggerMode =
  typeof process !== 'undefined' && process.env.NODE_ENV === 'production'
    ? 'error'
    : 'warn';

const leveledLogger = createLeveledLogger({
  defaultLevel: DEFAULT_LOG_LEVEL,
  prefix: '[admin-form]',
});

export const logger: Logger = leveledLogger.logger;

export function setLoggerLevel(level: LoggerMode) {
  leveledLogger.setLoggerLevel(level);
}

export function getLoggerLevel() {
  return leveledLogger.getLoggerLevel();
}
