/**
 * @admin-core/layout-vue
 * Vue 3 基础布局组件包
 * @description 开箱即用的管理后台布局，高度集成偏好设置
 * 
 * 内置 @admin-core/preferences-vue，无需单独引入
 * 
 * @example
 * ```vue
 * <script setup>
 * import { 
 *   // 布局组件
 *   BasicLayout,
 *   // 偏好设置（内置）
 *   initPreferences, 
 *   PreferencesProvider,
 *   usePreferences,
 * } from '@admin-core/layout-vue';
 * 
 * initPreferences({ namespace: 'my-app' });
 * </script>
 * 
 * <template>
 *   <PreferencesProvider>
 *     <BasicLayout :menus="menus" :current-path="route.path">
 *       <router-view />
 *     </BasicLayout>
 *   </PreferencesProvider>
 * </template>
 * ```
 */

// 样式
import './styles/index.css';

// ============================================================
// 内置 @admin-core/preferences-vue（用户无需单独引入）
// ============================================================
export {
  // Composables
  destroyPreferences,
  getPreferencesManager,
  initPreferences,
  useLayout,
  usePreferences,
  usePreferencesCategory,
  usePreferencesContext,
  type PreferencesContextValue,
  useTheme as usePreferencesTheme,
  // Components
  AdminIcon,
  AdminLayoutIcon,
  Icon,
  LayoutIcon,
  type IconProps,
  type LayoutIconProps,
  PreferencesProvider,
  PreferencesDrawer,
  PreferencesTrigger,
  AppearanceTab,
  LayoutTab,
  ShortcutKeysTab,
  GeneralTab,
  PreferencesBlock,
  PreferencesSwitchItem,
  PreferencesSelectItem,
  PreferencesSliderItem,
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
  // Assets
  defaultLockScreenBg,
  // Core Types
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
  // Drawer UI Config Types
  type FeatureItemConfig,
  type FeatureBlockConfig,
  type AppearanceTabConfig,
  type LayoutTabConfig,
  type GeneralTabConfig,
  type ShortcutKeysTabConfig,
  type HeaderActionsConfig,
  type FooterActionsConfig,
  type PreferencesDrawerUIConfig,
  // Core Constants
  BUILT_IN_THEME_PRESETS,
  COLOR_PRESETS,
  DEFAULT_PREFERENCES,
  LAYOUT_OPTIONS,
  PAGE_TRANSITION_OPTIONS,
  TABS_STYLE_OPTIONS,
  // Locales
  enUS as preferencesEnUS,
  getLocaleLabel,
  getLocaleMessages,
  supportedLocales,
  zhCN as preferencesZhCN,
} from '@admin-core/preferences-vue';

// ============================================================
// 布局组件和 Composables
// ============================================================

// 组件导出
// 明确选择组件 MenuItem，避免与共享类型同名导出冲突
export { MenuItem } from './components';
export * from './components';

// Composables 导出
export * from './composables';
// Router helpers
export * from './router/route-access';

// 从共享导出包重新导出核心类型和工具
export * from '@admin-core/layout-shared';

// Vue 插件
import { BasicLayout } from './components';
import type { App } from 'vue';

export interface LayoutPluginOptions {
  /** 组件前缀 */
  prefix?: string;
}

/**
 * Vue 插件安装函数
 */
export function install(app: App, options: LayoutPluginOptions = {}) {
  const prefix = options.prefix || '';

  app.component(`${prefix}BasicLayout`, BasicLayout);
}

export const LayoutPlugin = {
  install,
};
