/**
 * @admin-core/preferences
 * @description 框架无关的偏好设置管理系统
 *
 * 特性：
 * - 框架无关：核心逻辑不依赖 Vue/React
 * - OKLCH 颜色系统：只配置主色，自动派生语义色
 * - 多 UI 库适配：支持 Ant Design、Element Plus、Naive UI、shadcn/ui
 * - 国际化：内置中英文语言包
 * - 可配置：所有设置通过配置文件管理，禁止硬编码
 *
 * 使用方式：
 * ```ts
 * import { createPreferencesManager } from '@admin-core/preferences';
 *
 * const manager = createPreferencesManager({
 *   namespace: 'my-app',
 *   overrides: {
 *     theme: { colorPrimary: 'oklch(0.6 0.2 150)' }
 *   }
 * });
 *
 * manager.init();
 * ```
 */

// ========== 管理器 ==========
export {
  // 核心管理器
  createPreferencesManager,
  PreferencesManager,
  type PreferencesListener,
  // CSS 更新
  getActualThemeMode,
  updateAllCSSVariables,
  updateLayoutCSSVariables,
  updateSpecialModeClasses,
  updateThemeCSSVariables,
  setDOMSelectors,
  clearCSSUpdaterCache,
  // 生命周期管理
  ManagerLifecycle,
  createManagerLifecycle,
  getDefaultLifecycle,
  resetDefaultLifecycle,
} from './manager';

// ========== 业务操作 ==========
export {
  createPreferencesActions,
  createThemeActions,
  createLayoutActions,
  // Action 工厂（缓存管理）
  createActionFactory,
  getGlobalActionFactory,
  resetGlobalActionFactory,
  type PreferencesActions,
  type ThemeActions,
  type LayoutActions,
  type ActionFactory,
} from './actions';

// ========== 控制器 (Headless) ==========
export {
  SliderController,
  createSliderController,
  type SliderOptions,
} from './controllers/slider';

export {
  CopyButtonController,
  createCopyButtonController,
  getCopyButtonA11yProps,
  COPY_BUTTON_AUTO_RESET_MS,
  type CopyButtonOptions,
  type CopyButtonState,
} from './controllers/copy-button';

// ========== 辅助工具 ==========
export {
  // 选项工厂
  createTranslatedOptions,
  getLanguageOptions,
  getRadiusOptions,
  type TranslatedOption,
  type TranslatedOptions,
  type LanguageOption,
  // 抽屉配置
  DRAWER_TABS,
  DRAWER_DEFAULT_PROPS,
  DRAWER_HEADER_ACTIONS,
  DEFAULT_DRAWER_UI_CONFIG,
  getDrawerTabs,
  getVisibleDrawerTabs,
  getDrawerHeaderActions,
  getLocaleByPreferences,
  copyPreferencesConfig,
  validatePreferencesConfig,
  importPreferencesConfig,
  resolveFeatureConfig,
  getFeatureConfig,
  getFeatureItemConfig,
  createTabConfigResolver,
  isTabVisible,
  mergeDrawerUIConfig,
  type DrawerTabType,
  type DrawerTabConfig,
  type DrawerHeaderActionType,
  type DrawerHeaderAction,
  type ConfigValidationResult,
  type ImportConfigResult,
  type UITabConfig,
  // 图标工具
  ICON_SIZE_MAP,
  LAYOUT_ICON_SIZE,
  getIconSize,
  getIconStyle,
  getIconStyleString,
  getLayoutIconStyle,
  getLayoutIconContainerStyle,
  type ExtendedIconSize,
  // 字体缩放
  FONT_SCALE_CONFIG,
  FONT_SCALE_PRESETS,
  FONT_SCALE_CSS_VAR,
  FONT_SIZE_BASE_CSS_VAR,
  MENU_FONT_CONFIG,
  formatScaleToPercent,
  percentToScale,
  calculateFontSize,
  generateFontScaleVariables,
  clampFontScale,
  roundToStep,
  type FontScaleConfig,
  // 布局偏好映射
  mapPreferencesToLayoutProps,
  // 布局设置页辅助
  getLayoutTabConfigs,
  getLayoutTabOptions,
  createLayoutPreviewCache,
  getLayoutPreviewOptions,
  createLayoutTabUpdater,
  type LayoutTabConfigs,
  type LayoutTabUpdater,
  // 主题工具
  clearThemeModeCache,
  generateThemeCSSVariables,
  generateThemeClasses,
  type ThemeRuntimeConfig,
  // 锁屏辅助
  isLockScreenEnabled,
  hasLockScreenPassword,
  canLockScreen,
} from './helpers';

// ========== 配置 ==========
export {
  // 默认偏好设置
  DEFAULT_PREFERENCES,
  DEFAULT_PRIMARY_COLOR,
  getDefaultPreferences,
  clearDefaultPreferencesCache,
  // 快捷键配置
  SHORTCUT_KEY_BINDINGS,
  getShortcutKeys,
  getShortcutKeyDisplay,
  type ShortcutKeyBinding,
  // 设计令牌 - 类型
  type DesignTokens,
  type DrawerTokens,
  type LayoutIconTokens,
  type IconSizeTokens,
  type FontSizeTokens,
  type RadiusTokens,
  type BorderTokens,
  type TransitionTokens,
  type ColorTokens,
  type ZIndexTokens,
  // 设计令牌 - 默认值
  DEFAULT_DESIGN_TOKENS,
  DRAWER_TOKEN_DEFAULTS,
  LAYOUT_ICON_TOKEN_DEFAULTS,
  ICON_SIZE_TOKEN_DEFAULTS,
  FONT_SIZE_TOKEN_DEFAULTS,
  RADIUS_TOKEN_DEFAULTS,
  BORDER_TOKEN_DEFAULTS,
  TRANSITION_TOKEN_DEFAULTS,
  COLOR_TOKEN_DEFAULTS,
  Z_INDEX_TOKEN_DEFAULTS,
  // 设计令牌 - 配置 API
  configureDesignTokens,
  getDesignTokens,
  getDefaultDesignTokens,
  resetDesignTokens,
  // 设计令牌 - 快捷访问
  designTokens,
  drawer as drawerTokens,
  layoutIcon as layoutIconTokens,
  iconSizes as iconSizesTokens,
  fontSize as fontSizeTokens,
  radius as radiusTokens,
  border as borderTokens,
  transition as transitionTokens,
  colors as colorsTokens,
  zIndex as zIndexTokens,
  // CSS 生成
  generateCSSVariables,
  cssVarNames,
  // Tab 内容配置（Vue/React 共享）
  GENERAL_TAB_CONFIG,
  SHORTCUT_KEYS_TAB_CONFIG,
  LAYOUT_TAB_CONFIG,
  getNestedValue,
  getLocaleText,
  createPreferencesUpdate,
  type ControlType,
  type SwitchControlConfig,
  type SelectControlConfig,
  type BlockConfig,
  type TabConfig,
} from './config';

// ========== 类型定义 ==========
export type {
  // 主题类型
  BuiltinThemePreset,
  BuiltinThemeType,
  PageTransitionType,
  ThemeModeType,
  // 布局类型
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
  // 偏好设置接口
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
  // 工具类型
  DeepPartial,
  DeepReadonly,
  I18nAdapter,
  PlatformType,
  SelectOption,
  StorageAdapter,
  StorageError,
  StorageErrorType,
  PreferencesInitOptions,
  DOMSelectors,
  // 组件 Props 类型（Vue/React 共享）
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
  // 抽屉 UI 配置类型
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
} from './types';

// ========== 常量配置 ==========
export {
  // 主题
  BUILT_IN_THEME_PRESETS,
  COLOR_PRESETS,
  getBuiltinTheme,
  getThemePrimaryColor,
  // 布局
  BREADCRUMB_STYLE_OPTIONS,
  CONTENT_COMPACT_OPTIONS,
  DEFAULT_LAYOUT_SIZES,
  getLayoutLabel,
  HEADER_MENU_ALIGN_OPTIONS,
  HEADER_MODE_OPTIONS,
  LAYOUT_OPTIONS,
  NAVIGATION_STYLE_OPTIONS,
  TABS_STYLE_OPTIONS,
  // 动画
  ANIMATION_DURATION,
  ANIMATION_EASING,
  getAnimationDuration,
  getAnimationDurationCss,
  PAGE_TRANSITION_OPTIONS,
  type AnimationDurationType,
  // CSS 变量
  CSS_VAR_ANIMATION,
  CSS_VAR_LAYOUT,
  CSS_VAR_THEME,
  CSS_VAR_Z_INDEX,
  CSS_VARIABLES,
  DEFAULT_Z_INDEX,
  // UI 常量
  DEFAULT_RADIUS,
  FONT_SIZE_DEFAULT,
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  FONT_SIZE_STEP,
  RADIUS_OPTIONS,
  type RadiusOption,
  // 组件交互常量
  SLIDER_DEBOUNCE_MS,
  INPUT_DEBOUNCE_MS,
  INPUT_MAX_LENGTH,
  COPY_RESET_DELAY_MS,
  CLEAR_PASSWORD_RESET_DELAY_MS,
  FOCUS_DELAY_MS,
  CLOSE_ANIMATION_DELAY_MS,
  // 消息常量
  ERROR_MESSAGES,
  LOG_PREFIX,
  SUCCESS_MESSAGES,
  WARN_MESSAGES,
} from './constants';

// ========== 颜色系统 ==========
export {
  // OKLCH 工具
  adjustChroma,
  adjustLightness,
  createOklch,
  isValidColor,
  oklchToCss,
  oklchToHex,
  parseToOklch,
  rotateHue,
  type OklchColor,
  // 色阶生成
  COLOR_SHADES,
  generateColorScale,
  generateColorScaleVariables,
  type ColorShade,
  // 语义色派生
  clearSemanticColorCache,
  deriveSemanticColors,
  getSemanticColor,
  SEMANTIC_HUE_OFFSETS,
  type SemanticColorName,
  type SemanticColors,
  // 对比度计算
  generateContrastColors,
  getAccessibleForeground,
  getContrastColor,
  getContrastRatio,
  getRelativeLuminance,
  meetsWCAG,
  type WCAGLevel,
  // 颜色变量生成
  generateColorVariables,
  generateDarkNeutralColors,
  generateLightNeutralColors,
  generateThemeColorVariables,
  type ThemeColorOptions,
} from './color';

// ========== 工具函数 ==========
export {
  // 缓存管理
  createStorageManager,
  StorageManager,
  type StorageManagerOptions,
  // 深度合并
  deepClone,
  deepMerge,
  safeMerge,
  // 对象差异
  diff,
  diffWithKeys,
  extractChangedKeys,
  getChangedKeys,
  hasChanges,
  type DiffResult,
  // 平台检测
  formatShortcut,
  getModifierKeyText,
  getPlatform,
  isBrowser,
  isServer,
  hasDocument,
  hasNavigator,
  isLinux,
  isMacOs,
  isMobile,
  isTouchDevice,
  isWindows,
  // CSS 工具
  addClass,
  clearCSSVariablesCache,
  getAllCSSVariables,
  getCSSVariable,
  hasClass,
  removeClass,
  removeCSSVariable,
  removeCSSVariables,
  setCSSVariable,
  toggleClass,
  updateCSSVariables,
  // 通用工具
  get,
  isEmpty,
  isEqual,
  isObject,
  // 布局判断工具
  LAYOUT_CATEGORIES,
  isHeaderMenuLayout,
  isSidebarMenuLayout,
  isFullContentLayout,
  isMixedLayout,
  hasSidebar,
  hasHeaderMenu,
  getNavigationPosition,
  // 日志工具
  logger,
  type LogLevel,
  // 锁屏管理
  createLockScreenManager,
  type LockScreenManagerOptions,
  // 快捷键管理
  createShortcutManager,
  matchShortcutKey,
  type ShortcutKeyAction,
  type ShortcutKeyCallbacks,
  type ShortcutManagerOptions,
  type UseShortcutKeysResult,
  // 密码工具
  PASSWORD_MIN_LENGTH,
  hashPassword,
  hashPasswordSync,
  verifyPassword,
  verifyPasswordSync,
} from './utils';

// ========== 样式 ==========
export { adminCorePreset, tailwindPreset } from './styles';

// ========== 图标 ==========
export {
  // 布局图标（静态）
  getLayoutIcon,
  layoutIcons,
  // 内容宽度图标
  getContentWidthIcon,
  contentWidthIcons,
  type ContentWidthType,
  // 布局预览图生成器（动态）
  generateLayoutPreview,
  generatePreviewFromPreferences,
  generatePreviewWithOverrides,
  extractPreviewOptions,
  DEFAULT_PREVIEW_OPTIONS,
  type LayoutPreviewOptions,
  // 通用图标
  getIcon,
  hasIcon,
  icons,
  ICON_SIZES,
  type IconName,
  type IconSize,
} from './icons';

// ========== 国际化 ==========
export {
  enUS,
  getLocaleLabel,
  getLocaleMessages,
  getLocaleRegistry,
  getSupportedLocales,
  getTranslation,
  localeMessages,
  registerLocale,
  supportedLocales,
  translateOptions,
  zhCN,
  type LocaleMessages,
} from './locales';

// ========== 资源文件 ==========
export { defaultLockScreenBg } from './assets';
