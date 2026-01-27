/**
 * 管理器模块
 * @description 偏好设置管理器及相关功能
 */

// 核心管理器
export {
  PreferencesManager,
  createPreferencesManager,
  type PreferencesListener,
} from './preferences-manager';

// CSS 更新
export {
  getActualThemeMode,
  updateAllCSSVariables,
  updateLayoutCSSVariables,
  updateSpecialModeClasses,
  updateThemeCSSVariables,
  setDOMSelectors,
  clearCSSUpdaterCache,
} from './css-updater';

// 生命周期管理
export {
  ManagerLifecycle,
  createManagerLifecycle,
  getDefaultLifecycle,
  resetDefaultLifecycle,
} from './lifecycle';
