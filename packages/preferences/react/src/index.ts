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

// Hooks
export {
  destroyPreferences,
  getPreferencesManager,
  initPreferences,
  useLayout,
  usePreferences,
  usePreferencesCategory,
  useTheme,
  useDebouncedValue,
  type UseDebouncedValueOptions,
  type UseDebouncedValueReturn,
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
  // 主组件（推荐）
  PreferencesProvider,
  usePreferencesContext,
  type PreferencesProviderProps,
  // 单独使用（高级场景）
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
  PreferencesSliderItem,
  type PreferencesBlockProps,
  type PreferencesSwitchItemProps,
  type PreferencesSelectItemProps,
  type PreferencesSliderItemProps,
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
  // Constants
  BUILT_IN_THEME_PRESETS,
  COLOR_PRESETS,
  DEFAULT_PREFERENCES,
  LAYOUT_OPTIONS,
  PAGE_TRANSITION_OPTIONS,
  TABS_STYLE_OPTIONS,
  // Assets
  defaultLockScreenBg,
  // Locales
  enUS,
  getLocaleLabel,
  getLocaleMessages,
  supportedLocales,
  zhCN,
} from '@admin-core/preferences';
