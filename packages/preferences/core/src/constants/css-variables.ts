/**
 * CSS 变量名常量
 * @description 统一管理所有 CSS 变量名，避免硬编码
 */

/**
 * 布局相关 CSS 变量
 */
export const CSS_VAR_LAYOUT = {
  /** 内容高度 */
  CONTENT_HEIGHT: '--admin-content-height',
  /** 内容宽度 */
  CONTENT_WIDTH: '--admin-content-width',
  /** 顶栏高度 */
  HEADER_HEIGHT: '--admin-header-height',
  /** 页脚高度 */
  FOOTER_HEIGHT: '--admin-footer-height',
  /** 侧边栏宽度 */
  SIDEBAR_WIDTH: '--admin-sidebar-width',
  /** 侧边栏折叠宽度 */
  SIDEBAR_COLLAPSED_WIDTH: '--admin-sidebar-collapsed-width',
  /** 标签栏高度 */
  TABBAR_HEIGHT: '--admin-tabbar-height',
  /** 内容内边距 */
  CONTENT_PADDING: '--admin-content-padding',
  /** 内容内边距 - 顶部 */
  CONTENT_PADDING_TOP: '--admin-content-padding-top',
  /** 内容内边距 - 右侧 */
  CONTENT_PADDING_RIGHT: '--admin-content-padding-right',
  /** 内容内边距 - 底部 */
  CONTENT_PADDING_BOTTOM: '--admin-content-padding-bottom',
  /** 内容内边距 - 左侧 */
  CONTENT_PADDING_LEFT: '--admin-content-padding-left',
} as const;

/**
 * 主题相关 CSS 变量
 */
export const CSS_VAR_THEME = {
  /** 主色 */
  PRIMARY: '--primary',
  /** 主色前景色 */
  PRIMARY_FOREGROUND: '--primary-foreground',
  /** 成功色 */
  SUCCESS: '--success',
  /** 成功色前景色 */
  SUCCESS_FOREGROUND: '--success-foreground',
  /** 警告色 */
  WARNING: '--warning',
  /** 警告色前景色 */
  WARNING_FOREGROUND: '--warning-foreground',
  /** 危险色 */
  DESTRUCTIVE: '--destructive',
  /** 危险色前景色 */
  DESTRUCTIVE_FOREGROUND: '--destructive-foreground',
  /** 信息色 */
  INFO: '--info',
  /** 信息色前景色 */
  INFO_FOREGROUND: '--info-foreground',
  /** 背景色 */
  BACKGROUND: '--background',
  /** 前景色 */
  FOREGROUND: '--foreground',
  /** 弱化背景色 */
  MUTED: '--muted',
  /** 弱化前景色 */
  MUTED_FOREGROUND: '--muted-foreground',
  /** 强调背景色 */
  ACCENT: '--accent',
  /** 强调前景色 */
  ACCENT_FOREGROUND: '--accent-foreground',
  /** 边框色 */
  BORDER: '--border',
  /** 输入框边框色 */
  INPUT: '--input',
  /** 聚焦环颜色 */
  RING: '--ring',
  /** 圆角 */
  RADIUS: '--radius',
  /** 基础字体大小 */
  FONT_SIZE_BASE: '--font-size-base',
  /** 菜单字体大小 */
  MENU_FONT_SIZE: '--menu-font-size',
} as const;

/**
 * 动画相关 CSS 变量
 */
export const CSS_VAR_ANIMATION = {
  /** 快速动画时长 */
  DURATION_FAST: '--admin-duration-fast',
  /** 正常动画时长 */
  DURATION_NORMAL: '--admin-duration-normal',
  /** 慢速动画时长 */
  DURATION_SLOW: '--admin-duration-slow',
  /** 默认缓动函数 */
  EASING_DEFAULT: '--admin-easing-default',
  /** 加速缓动函数 */
  EASING_IN: '--admin-easing-in',
  /** 减速缓动函数 */
  EASING_OUT: '--admin-easing-out',
} as const;

/**
 * z-index 相关 CSS 变量
 */
export const CSS_VAR_Z_INDEX = {
  /** 基础层级 */
  BASE: '--admin-z-index-base',
  /** 下拉菜单层级 */
  DROPDOWN: '--admin-z-index-dropdown',
  /** 模态框层级 */
  MODAL: '--admin-z-index-modal',
  /** 弹出层层级 */
  POPOVER: '--admin-z-index-popover',
  /** 提示层级 */
  TOOLTIP: '--admin-z-index-tooltip',
  /** Toast 层级 */
  TOAST: '--admin-z-index-toast',
} as const;

/**
 * z-index 默认值
 */
export const DEFAULT_Z_INDEX = {
  base: 200,
  dropdown: 1000,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
} as const;

/**
 * 所有 CSS 变量常量
 */
export const CSS_VARIABLES = {
  ...CSS_VAR_LAYOUT,
  ...CSS_VAR_THEME,
  ...CSS_VAR_ANIMATION,
  ...CSS_VAR_Z_INDEX,
} as const;
