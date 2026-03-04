/**
 * Page 模块日志工具。
 * @description 统一封装日志级别控制与日志前缀，避免各子模块重复创建 logger。
 */

import { createLeveledLogger, type LoggerMode } from '@admin-core/shared-core';

/** 页面模块日志级别类型别名。 */
type LogLevel = LoggerMode;

/**
 * 页面模块分级日志实例。
 * @description 统一配置日志前缀与 info 输出通道。
 */
const leveledLogger = createLeveledLogger({
  infoMethod: 'warn',
  infoPrefix: '[admin-page:info]',
  prefix: '[admin-page]',
});

/**
 * 设置页面模块日志级别。
 * @param level 目标日志级别。
 * @returns 无返回值。
 */
export function setLoggerLevel(level: LogLevel) {
  leveledLogger.setLoggerLevel(level);
}

/**
 * 页面模块日志门面。
 * @description 对外暴露 `error/info/warn` 三个级别，内部委托到分级日志实例。
 */
export const logger = {
  /**
   * 输出错误级日志。
   * @param args 日志参数。
   * @returns 无返回值。
   */
  error(...args: unknown[]) {
    leveledLogger.logger.error(...args);
  },
  /**
   * 输出信息级日志。
   * @param args 日志参数。
   * @returns 无返回值。
   */
  info(...args: unknown[]) {
    leveledLogger.logger.info(...args);
  },
  /**
   * 输出告警级日志。
   * @param args 日志参数。
   * @returns 无返回值。
   */
  warn(...args: unknown[]) {
    leveledLogger.logger.warn(...args);
  },
};
