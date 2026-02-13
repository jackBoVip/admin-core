export type LogLevel = 'error' | 'info' | 'warn';
export type LoggerMode = LogLevel | 'silent';

export type Logger = {
  error: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
};

const LOG_PRIORITY: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
};

const DEFAULT_LOG_LEVEL: LoggerMode =
  typeof process !== 'undefined' && process.env.NODE_ENV === 'production'
    ? 'error'
    : 'warn';

let currentLogLevel: LoggerMode = DEFAULT_LOG_LEVEL;

function shouldLog(level: LogLevel) {
  if (currentLogLevel === 'silent') return false;
  return LOG_PRIORITY[level] <= LOG_PRIORITY[currentLogLevel];
}

export function setLoggerLevel(level: LoggerMode) {
  currentLogLevel = level;
}

export function getLoggerLevel() {
  return currentLogLevel;
}

export const logger: Logger = {
  error: (...args: any[]) => {
    if (!shouldLog('error')) return;
    console.error('[admin-form]', ...args);
  },
  info: (...args: any[]) => {
    if (!shouldLog('info')) return;
    console.info('[admin-form]', ...args);
  },
  warn: (...args: any[]) => {
    if (!shouldLog('warn')) return;
    console.warn('[admin-form]', ...args);
  },
};
