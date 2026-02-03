/**
 * React Hooks 模块
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

// 工具 Hooks（内部/外部可用）
export {
  useDebouncedValue,
  type UseDebouncedValueOptions,
  type UseDebouncedValueReturn,
} from './use-debounced-value';
