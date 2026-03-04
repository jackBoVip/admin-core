/**
 * Table Core 日志工具。
 * @description 基于 shared-core 分级日志器封装 table-core 日志输出能力。
 */
import { createLeveledLogger, type LoggerMode } from '@admin-core/shared-core';

/**
 * 表格模块支持的日志级别类型。
 */
type LogLevel = LoggerMode;

const leveledLogger = createLeveledLogger({
  prefix: '[admin-table]',
});

/**
 * 设置表格模块日志输出级别。
 * @param level 目标日志级别。
 * @returns 无返回值。
 */
export function setLoggerLevel(level: LogLevel) {
  leveledLogger.setLoggerLevel(level);
}

/**
 * 表格模块日志实例。
 * 统一透传到共享分级日志器，便于按级别控制输出。
 */
export const logger = {
  /**
   * 输出错误级别日志。
   * @param args 日志参数列表。
   * @returns 无返回值。
   */
  error(...args: any[]) {
    leveledLogger.logger.error(...args);
  },
  /**
   * 输出信息级别日志。
   * @param args 日志参数列表。
   * @returns 无返回值。
   */
  info(...args: any[]) {
    leveledLogger.logger.info(...args);
  },
  /**
   * 输出警告级别日志。
   * @param args 日志参数列表。
   * @returns 无返回值。
   */
  warn(...args: any[]) {
    leveledLogger.logger.warn(...args);
  },
};
