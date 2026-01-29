/**
 * 常量配置模块
 * @description 导出所有常量配置（不包含默认配置和设计令牌，它们在 config/ 目录）
 */

// 主题常量
export {
  BUILT_IN_THEME_PRESETS,
  COLOR_PRESETS,
  getBuiltinTheme,
  getThemePrimaryColor,
} from './themes';

// 布局常量
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

// 动画常量
export {
  ANIMATION_DURATION,
  ANIMATION_EASING,
  getAnimationDuration,
  getAnimationDurationCss,
  PAGE_TRANSITION_OPTIONS,
  type AnimationDurationType,
} from './animations';

// CSS 变量常量
export {
  CSS_VAR_ANIMATION,
  CSS_VAR_LAYOUT,
  CSS_VAR_THEME,
  CSS_VAR_Z_INDEX,
  CSS_VARIABLES,
  DEFAULT_Z_INDEX,
} from './css-variables';

// UI 常量（业务选项）
export {
  // 圆角
  DEFAULT_RADIUS,
  RADIUS_OPTIONS,
  type RadiusOption,
  // 字体大小
  FONT_SIZE_DEFAULT,
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  FONT_SIZE_STEP,
  // 组件交互常量
  SLIDER_DEBOUNCE_MS,
  INPUT_DEBOUNCE_MS,
  INPUT_MAX_LENGTH,
  COPY_RESET_DELAY_MS,
  CLEAR_PASSWORD_RESET_DELAY_MS,
  FOCUS_DELAY_MS,
  CLOSE_ANIMATION_DELAY_MS,
} from './ui';

// 消息常量
export {
  ERROR_MESSAGES,
  LOG_PREFIX,
  SUCCESS_MESSAGES,
  WARN_MESSAGES,
} from './messages';
