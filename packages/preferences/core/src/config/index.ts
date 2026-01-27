/**
 * 配置模块
 * @description 默认配置和设计令牌
 */

// 默认偏好设置
export {
  DEFAULT_PREFERENCES,
  DEFAULT_PRIMARY_COLOR,
  getDefaultPreferences,
  clearDefaultPreferencesCache,
} from './defaults';

// 设计令牌
export * from './tokens';

// Tab 内容配置
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
