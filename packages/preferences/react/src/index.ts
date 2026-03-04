/**
 * @admin-core/preferences-react
 * @description React 18 偏好设置集成
 *
 * 使用方式：
 * ```tsx
 * // App.tsx
 * import { initPreferences, PreferencesProvider } from '@admin-core/preferences-react';
 *
 * // 初始化（应用启动时调用一次）
 * initPreferences({ namespace: 'my-app' });
 *
 * // 使用 PreferencesProvider 包裹应用（自动集成锁屏、快捷键等功能）
 * function App() {
 *   return (
 *     <PreferencesProvider onLogout={...} onSearch={...}>
 *       <YourApp />
 *     </PreferencesProvider>
 *   );
 * }
 *
 * // 子组件中使用
 * function MyComponent() {
 *   const { preferences, setPreferences } = usePreferences();
 *   const { lock, togglePreferences } = usePreferencesContext();
 *   return <div>...</div>;
 * }
 * ```
 */

/** 偏好系统 Hooks 与初始化 API（React）。 */
export {
  destroyPreferences,
  getPreferencesManager,
  initPreferences,
  useAdminAntdTheme,
  useLayout,
  usePreferences,
  usePreferencesCategory,
  useTheme,
  useDebouncedValue,
  type AdminAntdCssVarConfig,
  type AdminAntdThemeAlgorithms,
  type AdminAntdThemeConfig,
  type UseAdminAntdThemeOptions,
  type UseDebouncedValueOptions,
  type UseDebouncedValueReturn,
} from './hooks';

/** 组件导出（React）。 */
export {
  /** 图标组件。 */
  Icon,
  AdminIcon,
  LayoutIcon,
  AdminLayoutIcon,
  type IconProps,
  type LayoutIconProps,
  /** 主组件（推荐） */
  PreferencesProvider,
  usePreferencesContext,
  type PreferencesProviderProps,
  /** 单独使用（高级场景） */
  PreferencesDrawer,
  PreferencesTrigger,
  type PreferencesDrawerProps,
  type PreferencesTriggerProps,
  /** 页签组件（可独立使用）。 */
  AppearanceTab,
  LayoutTab,
  ShortcutKeysTab,
  GeneralTab,
  type AppearanceTabProps,
  type LayoutTabProps,
  type ShortcutKeysTabProps,
  type GeneralTabProps,
  /** 基础组件 */
  PreferencesBlock,
  PreferencesSwitchItem,
  PreferencesSelectItem,
  PreferencesSliderItem,
  type PreferencesBlockProps,
  type PreferencesSwitchItemProps,
  type PreferencesSelectItemProps,
  type PreferencesSliderItemProps,
} from './components';

/** 便捷转导 core 层类型与工具。 */
export {
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
  /** 常量。 */
  BUILT_IN_THEME_PRESETS,
  COLOR_PRESETS,
  DEFAULT_PREFERENCES,
  LAYOUT_OPTIONS,
  PAGE_TRANSITION_OPTIONS,
  TABS_STYLE_OPTIONS,
  /** 资源。 */
  defaultLockScreenBg,
  /** 国际化资源。 */
  enUS,
  getLocaleLabel,
  getLocaleMessages,
  supportedLocales,
  zhCN,
} from '@admin-core/preferences';
