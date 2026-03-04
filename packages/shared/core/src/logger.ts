/**
 * Shared Core 日志工具。
 * @description 提供基础分级日志与可运行时配置日志器两套实现。
 */
/**
 * 基础日志级别。
 */
export type LoggerLevel = 'error' | 'info' | 'warn';
/**
 * 日志模式（含静默）。
 */
export type LoggerMode = LoggerLevel | 'silent';

/**
 * 分级日志接口。
 */
export interface LeveledLogger {
  /** 输出 error 日志。 */
  error: (...args: any[]) => void;
  /** 输出 info 日志。 */
  info: (...args: any[]) => void;
  /** 输出 warn 日志。 */
  warn: (...args: any[]) => void;
}

/**
 * 可配置日志级别。
 */
export type ConfigurableLoggerLevel = 'debug' | 'error' | 'info' | 'silent' | 'warn';

/**
 * 可配置日志器配置。
 */
export interface ConfigurableLoggerConfig {
  /** 是否启用。 */
  enabled: boolean;
  /** 当前日志级别。 */
  level: ConfigurableLoggerLevel;
  /** 日志前缀。 */
  prefix: string;
}

/**
 * 可配置日志器接口。
 */
export interface ConfigurableLogger {
  /** 更新配置。 */
  configure: (options: Partial<ConfigurableLoggerConfig>) => void;
  /** 输出 debug 日志。 */
  debug: (...args: unknown[]) => void;
  /** 输出 error 日志。 */
  error: (...args: unknown[]) => void;
  /** 获取当前配置。 */
  getConfig: () => Readonly<ConfigurableLoggerConfig>;
  /** 输出 info 日志。 */
  info: (...args: unknown[]) => void;
  /** 重置为默认配置。 */
  reset: () => void;
  /** 输出 warn 日志。 */
  warn: (...args: unknown[]) => void;
}

/**
 * 分级日志器创建参数。
 */
interface CreateLeveledLoggerOptions {
  /** 默认日志级别。 */
  defaultLevel?: LoggerMode;
  /** 信息级日志对应输出方法。 */
  infoMethod?: 'info' | 'warn';
  /** 信息级日志前缀。 */
  infoPrefix?: string;
  /** 默认日志前缀。 */
  prefix: string;
}

/**
 * 基础日志级别优先级映射。
 * @description 数字越小优先级越高，用于 `createLeveledLogger` 的输出判定。
 */
const LEVEL_PRIORITY: Record<LoggerLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
};

/**
 * 可配置日志级别优先级映射。
 * @description 数字越大表示阈值越严格，用于 `createConfigurableLogger` 的输出判定。
 */
const CONFIG_LEVEL_PRIORITY: Record<ConfigurableLoggerLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

/**
 * 创建分级日志器。
 * @description 返回基础 logger 实例及对应的级别读写控制方法。
 * @param options 创建参数。
 * @returns 分级日志器与级别控制方法。
 */
export function createLeveledLogger(options: CreateLeveledLoggerOptions) {
  const prefix = options.prefix;
  const infoPrefix = options.infoPrefix ?? prefix;
  const infoMethod = options.infoMethod ?? 'info';
  let currentLevel: LoggerMode = options.defaultLevel ?? 'warn';

  /**
   * 判断指定级别在当前模式下是否允许输出。
   * @param level 待判断日志级别。
   * @returns 是否允许输出。
   */
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

  /**
   * 更新当前分级日志器的输出级别。
   * @param level 新日志级别。
   * @returns 无返回值。
   */
  const setLoggerLevel = (level: LoggerMode) => {
    currentLevel = level;
  };

  /**
   * 读取当前分级日志器输出级别。
   * @returns 当前日志级别。
   */
  const getLoggerLevel = () => currentLevel;

  return {
    getLoggerLevel,
    logger,
    setLoggerLevel,
  };
}

/**
 * 创建可配置日志器。
 * @description 适用于运行时动态调整日志级别/前缀的场景。
 * @param defaultConfig 默认配置。
 * @returns 可配置日志器实例。
 */
export function createConfigurableLogger(
  defaultConfig: ConfigurableLoggerConfig
): ConfigurableLogger {
  let config: ConfigurableLoggerConfig = { ...defaultConfig };

  /**
   * 判断在当前配置下是否应输出指定级别日志。
   * @param level 待判断日志级别。
   * @returns 是否允许输出。
   */
  const shouldLog = (level: ConfigurableLoggerLevel) => {
    if (!config.enabled) {
      return false;
    }
    return CONFIG_LEVEL_PRIORITY[level] >= CONFIG_LEVEL_PRIORITY[config.level];
  };

  /**
   * 组装带前缀的日志参数。
   * @param args 原始参数数组。
   * @returns 处理后的参数数组。
   */
  const formatArgs = (args: unknown[]) => {
    if (config.prefix) {
      return [config.prefix, ...args];
    }
    return args;
  };

  return {
    /**
     * 合并更新日志配置。
     * @param options 增量配置项。
     * @returns 无返回值。
     */
    configure(options) {
      config = { ...config, ...options };
    },
    /**
     * 输出调试日志。
     * @param args 日志参数。
     * @returns 无返回值。
     */
    debug(...args: unknown[]) {
      if (!shouldLog('debug')) return;
      console.info(...formatArgs(args));
    },
    /**
     * 输出错误日志。
     * @param args 日志参数。
     * @returns 无返回值。
     */
    error(...args: unknown[]) {
      if (!shouldLog('error')) return;
      console.error(...formatArgs(args));
    },
    /**
     * 获取当前日志配置快照。
     * @returns 当前配置对象。
     */
    getConfig() {
      return { ...config };
    },
    /**
     * 输出信息日志。
     * @param args 日志参数。
     * @returns 无返回值。
     */
    info(...args: unknown[]) {
      if (!shouldLog('info')) return;
      console.info(...formatArgs(args));
    },
    /**
     * 重置为默认日志配置。
     * @returns 无返回值。
     */
    reset() {
      config = { ...defaultConfig };
    },
    /**
     * 输出警告日志。
     * @param args 日志参数。
     * @returns 无返回值。
     */
    warn(...args: unknown[]) {
      if (!shouldLog('warn')) return;
      console.warn(...formatArgs(args));
    },
  };
}
