/**
 * @admin-core/layout-react
 * React 基础布局组件包
 * @description 开箱即用的管理后台布局，高度集成偏好设置
 *
 * 内置 @admin-core/preferences-react，无需单独引入
 *
 * @example
 * ```tsx
 * import { 
 *   // 布局组件
 *   BasicLayout,
 *   // 偏好设置（内置）
 *   initPreferences, 
 *   PreferencesProvider,
 *   usePreferences,
 * } from '@admin-core/layout-react';
 * 
 * initPreferences({ namespace: 'my-app' });
 * 
 * function App() {
 *   return (
 *     <PreferencesProvider>
 *       <BasicLayout menus={menus} currentPath={location.pathname}>
 *         <Outlet />
 *       </BasicLayout>
 *     </PreferencesProvider>
 *   );
 * }
 * ```
 */

/**
 * 样式副作用入口。
 * @description 引入布局组件与偏好抽屉所需的基础样式变量与结构样式。
 */
import './styles/index.css';

/**
 * 内置 `@admin-core/preferences-react` 能力导出。
 * @description 用户使用 layout-react 时可直接获得偏好设置全套 API，无需额外安装。
 */
export {
  /** 组合式能力与状态钩子。 */
  destroyPreferences,
  getPreferencesManager,
  initPreferences,
  useAdminAntdTheme,
  useLayout,
  usePreferences,
  usePreferencesCategory,
  useTheme as usePreferencesTheme,
  type AdminAntdCssVarConfig,
  type AdminAntdThemeAlgorithms,
  type AdminAntdThemeConfig,
  type UseAdminAntdThemeOptions,
  /** 组件。 */
  Icon,
  AdminIcon,
  LayoutIcon,
  AdminLayoutIcon,
  type IconProps,
  type LayoutIconProps,
  PreferencesProvider,
  usePreferencesContext,
  type PreferencesProviderProps,
  PreferencesDrawer,
  PreferencesTrigger,
  type PreferencesDrawerProps,
  type PreferencesTriggerProps,
  AppearanceTab,
  LayoutTab,
  ShortcutKeysTab,
  GeneralTab,
  type AppearanceTabProps,
  type LayoutTabProps,
  type ShortcutKeysTabProps,
  type GeneralTabProps,
  PreferencesBlock,
  PreferencesSwitchItem,
  PreferencesSelectItem,
  PreferencesSliderItem,
  type PreferencesBlockProps,
  type PreferencesSwitchItemProps,
  type PreferencesSelectItemProps,
  type PreferencesSliderItemProps,
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
  /** 资源。 */
  defaultLockScreenBg,
  /** 国际化资源。 */
  enUS as preferencesEnUS,
  getLocaleLabel,
  getLocaleMessages,
  supportedLocales,
  zhCN as preferencesZhCN,
} from '@admin-core/preferences-react';

/**
 * 布局组件导出。
 * @description 显式导出 `MenuItem` 以避免与共享类型同名冲突。
 */
export { MenuItem } from './components';
export * from './components';

/**
 * React Hooks 导出。
 * @description 包含布局上下文、布局状态切片与业务增强 Hook。
 */
export * from './hooks';

/**
 * React 工具函数与路由辅助导出。
 * @description 包含图标渲染、路由访问控制与路径辅助工具。
 */
export * from './utils';
export * from './router/route-access';

/**
 * 重新导出 layout-shared 核心类型与工具能力。
 * @description 便于应用侧只依赖 `@admin-core/layout-react` 即可获取核心共享能力。
 */
export * from '@admin-core/layout-shared';
