/**
 * Vue Composables 模块
 * @description 提供 Vue 3 Composition API 风格的偏好设置管理
 */

export {
  destroyPreferences,
  getPreferencesManager,
  isPreferencesInitialized,
  initPreferences,
  useLayout,
  usePreferences,
  usePreferencesCategory,
  useTheme,
} from './use-preferences';

// 内部使用（被 PreferencesProvider 使用）
export {
  useShortcutKeys,
  type UseShortcutKeysOptions,
} from './use-shortcut-keys';

export { useLockScreen } from './use-lock-screen';

// 公共 API
export {
  usePreferencesContext,
  type PreferencesContextValue,
} from './use-preferences-context';

// 工具 Composables（内部/外部可用）
export {
  useDebouncedValue,
  type UseDebouncedValueOptions,
  type UseDebouncedValueReturn,
} from './use-debounced-value';
