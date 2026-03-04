/**
 * Preferences Core 日志工具。
 * @description 统一封装偏好中心模块日志实例与默认日志级别策略。
 */

import {
  createConfigurableLogger,
  type ConfigurableLoggerConfig,
  type ConfigurableLoggerLevel,
} from '@admin-core/shared-core';

/**
 * 日志级别类型别名。
 */
export type LogLevel = ConfigurableLoggerLevel;

/**
 * 日志配置类型别名。
 */
type LoggerConfig = ConfigurableLoggerConfig;

/**
 * 默认日志配置。
 * @description 生产环境默认降级到 `warn`，开发环境默认使用 `debug`。
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  prefix: '[Preferences]',
  enabled: true,
};

/** `preferences/core` 模块默认日志实例。 */
export const logger = createConfigurableLogger(DEFAULT_CONFIG);

/**
 * 默认导出偏好设置日志实例。
 */
export default logger;
