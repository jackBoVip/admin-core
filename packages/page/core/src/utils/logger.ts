type LogLevel = 'error' | 'info' | 'silent' | 'warn';

const levelOrder: Record<Exclude<LogLevel, 'silent'>, number> = {
  error: 0,
  warn: 1,
  info: 2,
};

let currentLevel: LogLevel = 'warn';

function shouldPrint(level: Exclude<LogLevel, 'silent'>) {
  if (currentLevel === 'silent') {
    return false;
  }
  return levelOrder[level] <= levelOrder[currentLevel as Exclude<LogLevel, 'silent'>];
}

export function setLoggerLevel(level: LogLevel) {
  currentLevel = level;
}

export const logger = {
  error(...args: any[]) {
    if (!shouldPrint('error')) {
      return;
    }
    console.error('[admin-page]', ...args);
  },
  info(...args: any[]) {
    if (!shouldPrint('info')) {
      return;
    }
    console.info('[admin-page]', ...args);
  },
  warn(...args: any[]) {
    if (!shouldPrint('warn')) {
      return;
    }
    console.warn('[admin-page]', ...args);
  },
};
