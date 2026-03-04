/**
 * 常量配置模块
 * @description 导出所有业务常量与样式变量常量（默认配置与设计令牌在 `config/`、`tokens/`）。
 */

/**
 * 主题常量导出。
 */
export {
  BUILT_IN_THEME_PRESETS,
  COLOR_PRESETS,
  getBuiltinTheme,
  getThemePrimaryColor,
} from './themes';

/**
 * 布局常量导出。
 * @description 提供布局模式、菜单对齐、页签风格等业务选项。
 */
export {
  BREADCRUMB_STYLE_OPTIONS,
  CONTENT_COMPACT_OPTIONS,
  DEFAULT_LAYOUT_SIZES,
  getLayoutLabel,
  HEADER_MENU_ALIGN_OPTIONS,
  HEADER_MODE_OPTIONS,
  LAYOUT_OPTIONS,
  NAVIGATION_STYLE_OPTIONS,
  TABS_STYLE_OPTIONS,
} from './layouts';

/**
 * 动画常量导出。
 * @description 提供过渡动画选项、时长映射与辅助工具函数。
 */
export {
  ANIMATION_DURATION,
  ANIMATION_EASING,
  getAnimationDuration,
  getAnimationDurationCss,
  PAGE_TRANSITION_OPTIONS,
  type AnimationDurationType,
} from './animations';

/**
 * CSS 变量常量导出。
 * @description 提供布局/主题/动画/层级变量名与默认层级值。
 */
export {
  CSS_VAR_ANIMATION,
  CSS_VAR_LAYOUT,
  CSS_VAR_THEME,
  CSS_VAR_Z_INDEX,
  CSS_VARIABLES,
  DEFAULT_Z_INDEX,
} from './css-variables';

/**
 * UI 常量导出（业务选项）。
 * @description 提供字号、圆角与交互时序相关常量。
 */
export {
  /**
   * 圆角相关常量。
   */
  DEFAULT_RADIUS,
  RADIUS_OPTIONS,
  type RadiusOption,
  /**
   * 字体大小相关常量。
   */
  FONT_SIZE_DEFAULT,
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  FONT_SIZE_STEP,
  /**
   * 组件交互时序常量。
   */
  SLIDER_DEBOUNCE_MS,
  INPUT_DEBOUNCE_MS,
  INPUT_MAX_LENGTH,
  COPY_RESET_DELAY_MS,
  CLEAR_PASSWORD_RESET_DELAY_MS,
  FOCUS_DELAY_MS,
  CLOSE_ANIMATION_DELAY_MS,
} from './ui';

/**
 * 消息常量导出。
 * @description 提供日志前缀与统一错误/警告/成功消息模板。
 */
export {
  ERROR_MESSAGES,
  LOG_PREFIX,
  SUCCESS_MESSAGES,
  WARN_MESSAGES,
} from './messages';
