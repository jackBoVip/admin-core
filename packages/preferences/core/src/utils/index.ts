/**
 * 工具函数模块
 * @description 导出所有工具函数
 */

// 共享工具
export { get, isEmpty, isEqual, isObject } from './helpers';

// 缓存管理
export {
  createStorageManager,
  StorageManager,
  type StorageManagerOptions,
} from './cache';

// 深度合并
export { deepClone, deepMerge, safeMerge } from './merge';

// 对象差异
export {
  diff,
  diffWithKeys,
  extractChangedKeys,
  getChangedKeys,
  hasChanges,
  type DiffResult,
} from './diff';

// 平台检测
export {
  formatShortcut,
  getModifierKeyText,
  getPlatform,
  // SSR 兼容
  hasDocument,
  hasNavigator,
  isBrowser,
  isLinux,
  isMacOs,
  isMobile,
  isServer,
  isTouchDevice,
  isWindows,
} from './platform';

// CSS 工具
export {
  addClass,
  clearCSSVariablesCache,
  getAllCSSVariables,
  getCSSVariable,
  hasClass,
  removeClass,
  removeCSSVariable,
  removeCSSVariables,
  setCSSVariable,
  toggleClass,
  updateCSSVariables,
} from './css';

// 日志工具
export { logger, type LogLevel } from './logger';
