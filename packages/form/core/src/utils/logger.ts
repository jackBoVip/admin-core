/**
 * Form Core 日志工具。
 * @description 基于 shared-core 分级日志器封装 form-core 日志输出能力。
 */
import { createLeveledLogger, type LoggerLevel, type LoggerMode } from '@admin-core/shared-core';

/**
 * 日志级别类型别名。
 */
export type LogLevel = LoggerLevel;
/** 日志模式类型（`silent`/`error`/`warn`/`info`）。 */
export type { LoggerMode };

/**
 * 表单模块日志接口。
 */
export type Logger = {
  /** 输出错误日志。 */
  error: (...args: any[]) => void;
  /** 输出信息日志。 */
  info: (...args: any[]) => void;
  /** 输出警告日志。 */
  warn: (...args: any[]) => void;
};

/** 默认日志级别，生产环境降级为 `error`，开发环境使用 `warn`。 */
const DEFAULT_LOG_LEVEL: LoggerMode =
  typeof process !== 'undefined' && process.env.NODE_ENV === 'production'
    ? 'error'
    : 'warn';

/** 分级日志器实例。 */
const leveledLogger = createLeveledLogger({
  defaultLevel: DEFAULT_LOG_LEVEL,
  prefix: '[admin-form]',
});

/**
 * 表单模块日志实例。
 */
export const logger: Logger = leveledLogger.logger;

/**
 * 设置当前日志输出级别。
 *
 * @param level 目标日志级别。
 * @returns 无返回值。
 */
export function setLoggerLevel(level: LoggerMode) {
  leveledLogger.setLoggerLevel(level);
}

/**
 * 读取当前日志输出级别。
 *
 * @returns 当前日志级别。
 */
export function getLoggerLevel() {
  return leveledLogger.getLoggerLevel();
}
