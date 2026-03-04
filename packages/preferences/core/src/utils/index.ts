/**
 * 偏好中心工具函数导出入口。
 * @description 汇总缓存、样式、差异比较、平台探测及安全能力等通用工具。
 */

/**
 * 共享工具导出。
 */
export {
  get,
  isEmpty,
  isEqual,
  isObject,
  /** 布局分类常量。 */
  LAYOUT_CATEGORIES,
  isFullContentLayout,
  isHeaderMenuLayout,
  isMixedLayout,
  isSidebarMenuLayout,
  hasSidebar,
  hasHeaderMenu,
  getNavigationPosition,
} from './helpers';

/**
 * 缓存管理导出。
 */
export {
  createStorageManager,
  StorageManager,
  type StorageManagerOptions,
} from './cache';

/**
 * 深度合并导出。
 */
export { deepClone, deepMerge, safeMerge } from './merge';

/**
 * 对象差异导出。
 */
export {
  diff,
  diffWithKeys,
  extractChangedKeys,
  getChangedKeys,
  hasChanges,
  type DiffResult,
} from './diff';

/**
 * 防抖节流导出。
 */
export {
  createDebouncedCallback,
  debounce,
  throttle,
  type DebouncedCallback,
} from './debounce';

/**
 * 平台检测导出。
 */
export {
  formatShortcut,
  getModifierKeyText,
  getPlatform,
  /** SSR 兼容环境检测。 */
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

/**
 * 样式工具导出。
 */
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

/**
 * 日志工具导出。
 */
export { logger, type LogLevel } from './logger';

/**
 * 锁屏管理导出。
 */
export {
  createAutoLockTimer,
  createLockScreenManager,
  type AutoLockTimerOptions,
  type LockScreenManagerOptions,
} from './lock-screen';

/**
 * 快捷键管理导出。
 */
export {
  createShortcutManager,
  matchShortcutKey,
  type ShortcutKeyAction,
  type ShortcutKeyCallbacks,
  type ShortcutManagerOptions,
  type UseShortcutKeysResult,
} from './shortcuts';

/**
 * 水印工具导出。
 */
export {
  buildWatermarkCacheKey,
  createWatermarkGenerator,
  formatWatermarkText,
  getWatermarkText,
  type WatermarkConfig,
  type WatermarkGenerator,
  type WatermarkGeneratorOptions,
  type WatermarkTextConfig,
} from './watermark';

/**
 * Tooltip 工具导出。
 */
export { setupPreferenceTooltip } from './tooltip';

/**
 * 密码工具导出。
 */
export {
  PASSWORD_MIN_LENGTH,
  hashPassword,
  hashPasswordSync,
  verifyPassword,
  verifyPasswordSync,
} from './password';

/**
 * 数值工具导出。
 */
export {
  clamp,
  parseNumber,
  formatNumber,
  isInRange,
} from './number';
