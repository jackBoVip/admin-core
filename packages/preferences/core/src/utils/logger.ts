import {
  createConfigurableLogger,
  type ConfigurableLoggerConfig,
  type ConfigurableLoggerLevel,
} from '@admin-core/shared-core';

export type LogLevel = ConfigurableLoggerLevel;

type LoggerConfig = ConfigurableLoggerConfig;

const DEFAULT_CONFIG: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  prefix: '[Preferences]',
  enabled: true,
};

export const logger = createConfigurableLogger(DEFAULT_CONFIG);

export default logger;
