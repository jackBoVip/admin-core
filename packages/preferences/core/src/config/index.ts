/**
 * 配置模块
 * @description 默认配置和设计令牌
 */

/**
 * 默认偏好设置与快捷键配置导出。
 */
export {
  DEFAULT_PREFERENCES,
  DEFAULT_PRIMARY_COLOR,
  getDefaultPreferences,
  clearDefaultPreferencesCache,
  /**
   * 快捷键配置导出。
   * @description 暴露快捷键绑定定义及文案转换工具。
   */
  SHORTCUT_KEY_BINDINGS,
  getShortcutKeys,
  getShortcutKeyDisplay,
  type ShortcutKeyBinding,
} from './defaults';

/**
 * 设计令牌导出。
 */
export * from '../tokens';

/**
 * 偏好抽屉 Tab 配置导出。
 */
export {
  GENERAL_TAB_CONFIG,
  SHORTCUT_KEYS_TAB_CONFIG,
  LAYOUT_TAB_CONFIG,
  getNestedValue,
  getLocaleText,
  createPreferencesUpdate,
  type ControlType,
  type SwitchControlConfig,
  type SelectControlConfig,
  type BlockConfig,
  type TabConfig,
} from './tabs';
