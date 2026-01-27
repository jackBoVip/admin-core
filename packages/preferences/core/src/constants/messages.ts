/**
 * 日志和错误消息常量
 * @description 统一管理开发者调试消息
 */

/**
 * 日志消息前缀
 */
export const LOG_PREFIX = {
  preferences: '[usePreferences]',
  storage: '[StorageManager]',
} as const;

/**
 * 警告消息
 */
export const WARN_MESSAGES = {
  /** Manager 已初始化 */
  managerAlreadyInitialized: `${LOG_PREFIX.preferences} Manager already initialized`,
  /** Storage 设置失败 */
  storageSetFailed: `${LOG_PREFIX.storage} Failed to set item:`,
  /** Storage 获取失败 */
  storageGetFailed: `${LOG_PREFIX.storage} Failed to get item:`,
  /** Storage 删除失败 */
  storageRemoveFailed: `${LOG_PREFIX.storage} Failed to remove item:`,
} as const;

/**
 * 错误消息
 */
export const ERROR_MESSAGES = {
  /** 复制配置失败 */
  copyConfigFailed: 'Failed to copy config',
  /** Manager 未初始化 */
  managerNotInitialized: `${LOG_PREFIX.preferences} Manager not initialized. Call initPreferences() first.`,
} as const;

/**
 * 成功消息（可用于 toast 等）
 */
export const SUCCESS_MESSAGES = {
  /** CSS 文件复制成功 */
  cssCopied: 'CSS files copied successfully',
} as const;
