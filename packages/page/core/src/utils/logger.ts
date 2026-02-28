import { createLeveledLogger, type LoggerMode } from '@admin-core/shared-core';

type LogLevel = LoggerMode;

const leveledLogger = createLeveledLogger({
  infoMethod: 'warn',
  infoPrefix: '[admin-page:info]',
  prefix: '[admin-page]',
});

export function setLoggerLevel(level: LogLevel) {
  leveledLogger.setLoggerLevel(level);
}

export const logger = {
  error(...args: unknown[]) {
    leveledLogger.logger.error(...args);
  },
  info(...args: unknown[]) {
    leveledLogger.logger.info(...args);
  },
  warn(...args: unknown[]) {
    leveledLogger.logger.warn(...args);
  },
};
