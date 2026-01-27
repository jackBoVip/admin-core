/**
 * @admin-core/preferences-react
 * @description React 18 偏好设置集成
 *
 * 使用方式：
 * ```tsx
 * // App.tsx
 * import { initPreferences, usePreferences, useTheme } from '@admin-core/preferences-react';
 *
 * // 初始化（应用启动时调用一次）
 * initPreferences({ namespace: 'my-app' });
 *
 * // 组件中使用
 * function MyComponent() {
 *   const { preferences, setPreferences, isDark, toggleTheme } = usePreferences();
 *   const { theme, setPrimaryColor } = useTheme();
 *
 *   return <div>...</div>;
 * }
 * ```
 */

// Hooks
export {
  destroyPreferences,
  getPreferencesManager,
  initPreferences,
  useLayout,
  usePreferences,
  usePreferencesCategory,
  useTheme,
} from './hooks';

// Components
export {
  // Icon 组件
  Icon,
  AdminIcon,
  LayoutIcon,
  AdminLayoutIcon,
  type IconProps,
  type LayoutIconProps,
  // 主组件
  PreferencesDrawer,
  PreferencesTrigger,
  type PreferencesDrawerProps,
  type PreferencesTriggerProps,
  // Tab 组件（可独立使用）
  AppearanceTab,
  LayoutTab,
  ShortcutKeysTab,
  GeneralTab,
  type AppearanceTabProps,
  type LayoutTabProps,
  type ShortcutKeysTabProps,
  type GeneralTabProps,
  // 基础组件
  PreferencesBlock,
  PreferencesSwitchItem,
  PreferencesSelectItem,
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
