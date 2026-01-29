/**
 * @admin-core/preferences-vue
 * @description Vue 3 偏好设置集成
 *
 * 使用方式：
 * ```vue
 * // App.vue
 * <script setup>
 * import { initPreferences, PreferencesProvider } from '@admin-core/preferences-vue';
 *
 * // 初始化（应用启动时调用一次）
 * initPreferences({ namespace: 'my-app' });
 * </script>
 *
 * <template>
 *   <PreferencesProvider @logout="..." @search="...">
 *     <YourApp />
 *   </PreferencesProvider>
 * </template>
 *
 * // 子组件中使用
 * <script setup>
 * import { usePreferences, usePreferencesContext } from '@admin-core/preferences-vue';
 *
 * const { preferences, setPreferences } = usePreferences();
 * const { lock, togglePreferences } = usePreferencesContext();
 * </script>
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
  usePreferencesContext,
  type PreferencesContextValue,
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
  // 主组件（推荐）
  PreferencesProvider,
  // 单独使用（高级场景）
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
  PreferencesSliderItem,
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
  type PreferencesSliderItemProps,
} from './components';

// 导出默认锁屏背景图片（供用户自定义使用）
export { defaultLockScreenBg } from '@admin-core/preferences';

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
