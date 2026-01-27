/**
 * @admin-core/preferences-vue
 * @description Vue 3 偏好设置集成
 *
 * 使用方式：
 * ```ts
 * // main.ts
 * import { initPreferences } from '@admin-core/preferences-vue';
 *
 * initPreferences({ namespace: 'my-app' });
 *
 * // 组件中
 * import { usePreferences, useTheme } from '@admin-core/preferences-vue';
 *
 * const { preferences, setPreferences, isDark, toggleTheme } = usePreferences();
 * const { theme, setPrimaryColor } = useTheme();
 * ```
 */

// Composables
export {
  destroyPreferences,
  getPreferencesManager,
  initPreferences,
  useLayout,
  usePreferences,
  usePreferencesCategory,
  useTheme,
} from './composables';

// Components
export {
  AdminIcon,
  AdminLayoutIcon,
  Icon,
  LayoutIcon,
  // Icon 组件类型
  type IconProps,
  type LayoutIconProps,
  // 主组件
  PreferencesDrawer,
  PreferencesTrigger,
  // Tab 组件（可独立使用）
  AppearanceTab,
  LayoutTab,
  ShortcutKeysTab,
  GeneralTab,
  // 基础组件
  PreferencesBlock,
  PreferencesSwitchItem,
  PreferencesSelectItem,
  // 组件类型
  type PreferencesDrawerProps,
  type PreferencesTriggerProps,
  type AppearanceTabProps,
  type LayoutTabProps,
  type ShortcutKeysTabProps,
  type GeneralTabProps,
  type PreferencesBlockProps,
  type PreferencesSwitchItemProps,
  type PreferencesSelectItemProps,
} from './components';

// Re-export core types and utilities for convenience
export {
  // Types
  type AppPreferences,
  type BreadcrumbPreferences,
  type BuiltinThemePreset,
  type BuiltinThemeType,
  type CopyrightPreferences,
  type DeepPartial,
  type FooterPreferences,
  type HeaderPreferences,
  type IconName,
  type IconSize,
  type LayoutType,
  type LogoPreferences,
  type NavigationPreferences,
  type Preferences,
  type PreferencesInitOptions,
  type PreferencesKeys,
  type ShortcutKeyPreferences,
  type SidebarPreferences,
  type TabbarPreferences,
  type ThemeModeType,
  type ThemePreferences,
  type TransitionPreferences,
  type WidgetPreferences,
  // Constants
  BUILT_IN_THEME_PRESETS,
  COLOR_PRESETS,
  DEFAULT_PREFERENCES,
  LAYOUT_OPTIONS,
  PAGE_TRANSITION_OPTIONS,
  TABS_STYLE_OPTIONS,
  // Locales
  enUS,
  getLocaleLabel,
  getLocaleMessages,
  supportedLocales,
  zhCN,
} from '@admin-core/preferences';
