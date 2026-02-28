import { createLeveledLogger, type LoggerMode } from '@admin-core/shared-core';

type LogLevel = LoggerMode;

const leveledLogger = createLeveledLogger({
  prefix: '[admin-table]',
});

export function setLoggerLevel(level: LogLevel) {
  leveledLogger.setLoggerLevel(level);
}

export const logger = {
  error(...args: any[]) {
    leveledLogger.logger.error(...args);
  },
  info(...args: any[]) {
    leveledLogger.logger.info(...args);
  },
  warn(...args: any[]) {
    leveledLogger.logger.warn(...args);
  },
};
