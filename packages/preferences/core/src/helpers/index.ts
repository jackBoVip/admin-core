/**
 * 辅助工具模块
 * @description 框架无关的工具函数和配置
 */

// 选项工厂
export {
  createTranslatedOptions,
  getLanguageOptions,
  getRadiusOptions,
  type TranslatedOption,
  type TranslatedOptions,
  type LanguageOption,
} from './options-factory';

// 抽屉配置
export {
  DRAWER_TABS,
  DRAWER_DEFAULT_PROPS,
  DRAWER_HEADER_ACTIONS,
  getDrawerTabs,
  getDrawerHeaderActions,
  getLocaleByPreferences,
  copyPreferencesConfig,
  validatePreferencesConfig,
  importPreferencesConfig,
  type DrawerTabType,
  type DrawerTabConfig,
  type DrawerHeaderActionType,
  type DrawerHeaderAction,
  type ConfigValidationResult,
  type ImportConfigResult,
} from './drawer-config';

// 图标工具
export {
  ICON_SIZE_MAP,
  LAYOUT_ICON_SIZE,
  getIconSize,
  getIconStyle,
  getIconStyleString,
  getLayoutIconStyle,
  getLayoutIconContainerStyle,
  type ExtendedIconSize,
} from './icon';

// 字体缩放
export {
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
} from './font-scale';
