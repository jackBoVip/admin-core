import {
  createConfigurableLogger,
  type ConfigurableLoggerConfig,
  type ConfigurableLoggerLevel,
} from '@admin-core/shared-core';

/**
 * 布局日志级别类型别名。
 */
export type LogLevel = ConfigurableLoggerLevel;

/**
 * 布局日志配置类型别名。
 */
type LoggerConfig = ConfigurableLoggerConfig;

const DEFAULT_CONFIG: LoggerConfig = {
  level: typeof process !== 'undefined' && process.env?.NODE_ENV === 'production' ? 'warn' : 'debug',
  prefix: '[Layout]',
  enabled: true,
};

/** `layout/core` 模块默认日志实例。 */
export const logger = createConfigurableLogger(DEFAULT_CONFIG);

/**
 * 默认导出布局日志实例。
 */
export default logger;
