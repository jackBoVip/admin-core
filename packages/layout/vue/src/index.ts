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
export * from './components';

// Composables 导出
export * from './composables';

// 从核心包重新导出类型和工具
export {
  // 类型
  type BasicLayoutProps,
  type LayoutEvents,
  type LayoutSlotName,
  type LayoutState,
  type LayoutContext,
  type LayoutComputed,
  type LayoutVisibility,
  type LayoutDisabled,
  type LayoutWidgetConfig,
  type MenuItem,
  type TabItem,
  type BreadcrumbItem,
  type UserInfo,
  type NotificationItem,
  type AutoTabConfig,
  type AutoBreadcrumbConfig,
  type ThemeConfig,
  type WatermarkConfig,
  type LockScreenConfig,
  type CheckUpdatesConfig,
  type RouterConfig,
  type RouterNavigateFunction,
  // 常量
  DEFAULT_LAYOUT_CONFIG,
  DEFAULT_HEADER_CONFIG,
  DEFAULT_SIDEBAR_CONFIG,
  DEFAULT_TABBAR_CONFIG,
  DEFAULT_FOOTER_CONFIG,
  DEFAULT_BREADCRUMB_CONFIG,
  DEFAULT_NAVIGATION_CONFIG,
  DEFAULT_PANEL_CONFIG,
  DEFAULT_LOGO_CONFIG,
  DEFAULT_COPYRIGHT_CONFIG,
  DEFAULT_WIDGET_CONFIG,
  DEFAULT_VISIBILITY_CONFIG,
  DEFAULT_DISABLED_CONFIG,
  DEFAULT_CONTENT_CONFIG,
  DEFAULT_LAYOUT_STATE,
  DEFAULT_TRANSITION_CONFIG,
  DEFAULT_SHORTCUT_KEYS_CONFIG,
  DEFAULT_THEME_CONFIG,
  DEFAULT_WATERMARK_CONFIG,
  DEFAULT_LOCK_SCREEN_CONFIG,
  DEFAULT_CHECK_UPDATES_CONFIG,
  DEFAULT_AUTO_TAB_CONFIG,
  DEFAULT_AUTO_BREADCRUMB_CONFIG,
  LAYOUT_CATEGORIES,
  CSS_VAR_NAMES,
  ANIMATION_DURATION,
  HEADER_TRIGGER_DISTANCE,
  BREAKPOINTS,
  // 工具函数
  isLayoutInCategory,
  isFullContentLayout,
  isSidebarMixedNavLayout,
  isHeaderNavLayout,
  isMixedNavLayout,
  isHeaderMixedNavLayout,
  shouldShowSidebar,
  shouldShowHeader,
  calculateSidebarWidth,
  calculateHeaderHeight,
  calculateTabbarHeight,
  calculateFooterHeight,
  calculatePanelWidth,
  calculateLayoutComputed,
  generateCSSVariables,
  findMenuByKey,
  getMenuPath,
  flattenMenus,
  filterHiddenMenus,
  mergeConfig,
  // 自动标签/面包屑
  TabManager,
  generateBreadcrumbsFromMenus,
  findMenuByPath,
  getMenuPathByPath,
  // Preferences 深度集成工具函数
  mapPreferencesToLayoutProps,
  generateThemeCSSVariables,
  generateThemeClasses,
  generateWatermarkStyle,
  generateWatermarkContent,
  shouldShowLockScreen,
  createAutoLockTimer,
  createCheckUpdatesTimer,
  getResolvedLayoutProps,
  generateAllCSSVariables,
  // 国际化
  createI18n,
  builtinLocales,
  zhCN,
  enUS,
  type LayoutLocale,
  type SupportedLocale,
  type I18nInstance,
  // 样式
  layoutThemeTokens,
  tailwindThemeCSS,
  layoutBaseCSS,
  layoutUtilitiesCSS,
  layoutFullCSS,
} from '@admin-core/layout';

// Vue 插件
import type { App } from 'vue';
import { BasicLayout } from './components';

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
