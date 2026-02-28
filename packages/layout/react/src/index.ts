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

// 样式
import './styles/index.css';

// ============================================================
// 内置 @admin-core/preferences-react（用户无需单独引入）
// ============================================================
export {
  // Hooks
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
  // Components
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
  // Assets
  defaultLockScreenBg,
  // Locales
  enUS as preferencesEnUS,
  getLocaleLabel,
  getLocaleMessages,
  supportedLocales,
  zhCN as preferencesZhCN,
} from '@admin-core/preferences-react';

// ============================================================
// 布局组件和 Hooks
// ============================================================

// 组件导出
// 明确选择组件 MenuItem，避免与共享类型同名导出冲突
export { MenuItem } from './components';
export * from './components';

// Hooks 导出
export * from './hooks';

// 工具函数导出
export * from './utils';
// Router helpers
export * from './router/route-access';

// 从共享导出包重新导出核心类型和工具
export * from '@admin-core/layout-shared';
