/**
 * Vue Composables 模块导出。
 * @description 汇总偏好系统在 Vue 端的业务 Composable 与工具 Composable。
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

/** 内部使用（被 `PreferencesProvider` 使用）。 */
export {
  useShortcutKeys,
  type UseShortcutKeysOptions,
} from './use-shortcut-keys';

export { useLockScreen } from './use-lock-screen';

/** 公共 API（可直接对外使用）。 */
export {
  usePreferencesContext,
  type PreferencesContextValue,
} from './use-preferences-context';

/** 工具 Composables（内部/外部可用） */
export {
  useDebouncedValue,
  type UseDebouncedValueOptions,
  type UseDebouncedValueReturn,
} from './use-debounced-value';
