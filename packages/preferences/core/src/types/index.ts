/**
 * 类型定义模块
 * @description 导出所有类型定义
 */

// 主题相关类型
export type {
  BuiltinThemePreset,
  BuiltinThemeType,
  PageTransitionType,
  ThemeModeType,
} from './theme';

// 布局相关类型
export type {
  AccessModeType,
  AuthPageLayoutType,
  BreadcrumbStyleType,
  ContentCompactType,
  LayoutHeaderMenuAlignType,
  LayoutHeaderModeType,
  LayoutType,
  LoginExpiredModeType,
  NavigationStyleType,
  PreferencesButtonPositionType,
  SupportedLanguagesType,
  TabsStyleType,
  TimezoneOption,
} from './layout';

// 偏好设置接口
export type {
  AppPreferences,
  BreadcrumbPreferences,
  CopyrightPreferences,
  FooterPreferences,
  HeaderPreferences,
  LockScreenPreferences,
  LogoPreferences,
  NavigationPreferences,
  PanelPositionType,
  PanelPreferences,
  Preferences,
  PreferencesKeys,
  ShortcutKeyPreferences,
  SidebarPreferences,
  TabbarPreferences,
  ThemePreferences,
  TransitionPreferences,
  WidgetPreferences,
} from './preferences';

// 工具类型
export type {
  DeepPartial,
  DeepReadonly,
  I18nAdapter,
  PlatformType,
  SelectOption,
  StorageAdapter,
  StorageError,
  StorageErrorType,
} from './utils';

// 适配器类型
export type { PreferencesInitOptions, DOMSelectors } from './adapters';

// 组件 Props 类型（Vue/React 共享）
export type {
  DrawerComponentProps,
  TriggerComponentProps,
  BlockComponentProps,
  SwitchComponentProps,
  SelectComponentProps,
  TabComponentProps,
  AppearanceTabComponentProps,
  LayoutTabComponentProps,
  ShortcutKeysTabComponentProps,
  GeneralTabComponentProps,
  LockScreenComponentProps,
  LockPasswordModalComponentProps,
  PreferencesProviderComponentProps,
} from './components';

// 抽屉 UI 配置类型
export type {
  FeatureItemConfig,
  FeatureBlockConfig,
  AppearanceTabConfig,
  LayoutTabConfig,
  GeneralTabConfig,
  ShortcutKeysTabConfig,
  HeaderActionsConfig,
  FooterActionsConfig,
  PreferencesDrawerUIConfig,
  ResolvedFeatureConfig,
} from './drawer-config';
