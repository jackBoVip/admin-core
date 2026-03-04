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

/**
 * 样式副作用入口。
 */
import './styles/index.css';

/**
 * 内置 `@admin-core/preferences-vue` 能力导出。
 * @description 用户使用 layout-vue 时可直接获得偏好设置全套 API，无需额外安装。
 */
export {
  /** 组合式能力。 */
  destroyPreferences,
  getPreferencesManager,
  initPreferences,
  useLayout,
  usePreferences,
  usePreferencesCategory,
  usePreferencesContext,
  type PreferencesContextValue,
  useTheme as usePreferencesTheme,
  /** 组件。 */
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
  /** 资源。 */
  defaultLockScreenBg,
  /** 核心类型。 */
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
  /** 抽屉 UI 配置类型。 */
  type FeatureItemConfig,
  type FeatureBlockConfig,
  type AppearanceTabConfig,
  type LayoutTabConfig,
  type GeneralTabConfig,
  type ShortcutKeysTabConfig,
  type HeaderActionsConfig,
  type FooterActionsConfig,
  type PreferencesDrawerUIConfig,
  /** 核心常量。 */
  BUILT_IN_THEME_PRESETS,
  COLOR_PRESETS,
  DEFAULT_PREFERENCES,
  LAYOUT_OPTIONS,
  PAGE_TRANSITION_OPTIONS,
  TABS_STYLE_OPTIONS,
  /** 国际化资源。 */
  enUS as preferencesEnUS,
  getLocaleLabel,
  getLocaleMessages,
  supportedLocales,
  zhCN as preferencesZhCN,
} from '@admin-core/preferences-vue';

/**
 * 布局组件导出。
 * @description 显式导出 `MenuItem` 以避免与共享类型同名冲突。
 */
export { MenuItem } from './components';
export * from './components';

/**
 * Vue Composables 与路由辅助导出。
 */
export * from './composables';
export * from './router/route-access';

/**
 * 重新导出 layout-shared 核心类型与工具能力。
 */
export * from '@admin-core/layout-shared';

/**
 * Vue 插件依赖导入。
 */
import { BasicLayout } from './components';
import type { App } from 'vue';

/**
 * Layout Vue 插件安装参数。
 */
export interface LayoutPluginOptions {
  /** 组件前缀 */
  prefix?: string;
}

/**
 * Vue 插件安装函数。
 *
 * @param app Vue 应用实例。
 * @param options 插件安装选项，支持组件前缀。
 */
export function install(app: App, options: LayoutPluginOptions = {}) {
  /**
   * 组件注册前缀
   * @description 为空时使用默认组件名。
   */
  const prefix = options.prefix || '';

  app.component(`${prefix}BasicLayout`, BasicLayout);
}

/**
 * Layout Vue 插件对象。
 * @description 统一注册布局组件与全局配置，供 `app.use` 直接安装。
 */
export const LayoutPlugin = {
  install,
};
