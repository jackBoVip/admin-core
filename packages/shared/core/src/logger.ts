export type LoggerLevel = 'error' | 'info' | 'warn';
export type LoggerMode = LoggerLevel | 'silent';

export interface LeveledLogger {
  error: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
}

export type ConfigurableLoggerLevel = 'debug' | 'error' | 'info' | 'silent' | 'warn';

export interface ConfigurableLoggerConfig {
  enabled: boolean;
  level: ConfigurableLoggerLevel;
  prefix: string;
}

export interface ConfigurableLogger {
  configure: (options: Partial<ConfigurableLoggerConfig>) => void;
  debug: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  getConfig: () => Readonly<ConfigurableLoggerConfig>;
  info: (...args: unknown[]) => void;
  reset: () => void;
  warn: (...args: unknown[]) => void;
}

interface CreateLeveledLoggerOptions {
  defaultLevel?: LoggerMode;
  infoMethod?: 'info' | 'warn';
  infoPrefix?: string;
  prefix: string;
}

const LEVEL_PRIORITY: Record<LoggerLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
};

const CONFIG_LEVEL_PRIORITY: Record<ConfigurableLoggerLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

export function createLeveledLogger(options: CreateLeveledLoggerOptions) {
  const prefix = options.prefix;
  const infoPrefix = options.infoPrefix ?? prefix;
  const infoMethod = options.infoMethod ?? 'info';
  let currentLevel: LoggerMode = options.defaultLevel ?? 'warn';

  const shouldLog = (level: LoggerLevel) => {
    if (currentLevel === 'silent') {
      return false;
    }
    return LEVEL_PRIORITY[level] <= LEVEL_PRIORITY[currentLevel];
  };

  const logger: LeveledLogger = {
    error: (...args: any[]) => {
      if (!shouldLog('error')) return;
      console.error(prefix, ...args);
    },
    info: (...args: any[]) => {
      if (!shouldLog('info')) return;
      if (infoMethod === 'warn') {
        console.warn(infoPrefix, ...args);
        return;
      }
      console.info(infoPrefix, ...args);
    },
    warn: (...args: any[]) => {
      if (!shouldLog('warn')) return;
      console.warn(prefix, ...args);
    },
  };

  const setLoggerLevel = (level: LoggerMode) => {
    currentLevel = level;
  };

  const getLoggerLevel = () => currentLevel;

  return {
    getLoggerLevel,
    logger,
    setLoggerLevel,
  };
}

export function createConfigurableLogger(
  defaultConfig: ConfigurableLoggerConfig
): ConfigurableLogger {
  let config: ConfigurableLoggerConfig = { ...defaultConfig };

  const shouldLog = (level: ConfigurableLoggerLevel) => {
    if (!config.enabled) {
      return false;
    }
    return CONFIG_LEVEL_PRIORITY[level] >= CONFIG_LEVEL_PRIORITY[config.level];
  };

  const formatArgs = (args: unknown[]) => {
    if (config.prefix) {
      return [config.prefix, ...args];
    }
    return args;
  };

  return {
    configure(options) {
      config = { ...config, ...options };
    },
    debug(...args: unknown[]) {
      if (!shouldLog('debug')) return;
      console.info(...formatArgs(args));
    },
    error(...args: unknown[]) {
      if (!shouldLog('error')) return;
      console.error(...formatArgs(args));
    },
    getConfig() {
      return { ...config };
    },
    info(...args: unknown[]) {
      if (!shouldLog('info')) return;
      console.info(...formatArgs(args));
    },
    reset() {
      config = { ...defaultConfig };
    },
    warn(...args: unknown[]) {
      if (!shouldLog('warn')) return;
      console.warn(...formatArgs(args));
    },
  };
}
