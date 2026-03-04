/**
 * UI 相关常量。
 * @description React/Vue 共享的 UI 令牌集合，用于避免硬编码漂移与跨端不一致。
 */

/**
 * 布局 UI 令牌常量集合。
 * @description 汇总虚拟滚动、搜索、通知、标签滚动与布局尺寸等运行时参数。
 */
export const LAYOUT_UI_TOKENS = {
  TAB_RENDER_CHUNK: 60,
  MENU_RENDER_CHUNK: 80,
  SUB_MENU_RENDER_CHUNK: 60,
  MENU_OVERSCAN: 4,
  POPUP_OVERSCAN: 4,
  VIRTUAL_OVERSCAN: 4,
  RESULT_OVERSCAN: 4,
  MENU_ITEM_HEIGHT: 48,
  POPUP_MENU_ITEM_HEIGHT: 44,
  TABBAR_CHROME_CORNER_SIZE: 7,
  /* 搜索相关 */
  SEARCH_MAX_RESULTS: 200,
  SEARCH_RESULT_MAX_HEIGHT: 320,
  SEARCH_RESULT_ITEM_HEIGHT: 56,
  /* 通知相关 */
  NOTIFICATION_MAX_HEIGHT: 320,
  NOTIFICATION_ITEM_HEIGHT: 72,
  /* 标签栏滚动相关 */
  TABBAR_SCROLL_DELAY: 320,
  TABBAR_SCROLL_OFFSET_RATIO: 0.6,
  TABBAR_SCROLL_MIN_OFFSET: 120,
  /* 布局相关 */
  FLOATING_BUTTON_INSET: 24,
  /* 菜单项缩进 */
  MENU_ITEM_BASE_PADDING: 16,
  MENU_ITEM_LEVEL_INDENT: 16,
  /* 弹出菜单虚拟滚动 */
  POPUP_VIRTUAL_MIN_ITEMS: 50,
  /* 偏好设置相关 */
  PREFERENCES_STEPPER_WIDTH: 165,
  PREFERENCES_STEPPER_GAP: 12,
  /* Z-Index 层级 */
  DROPDOWN_Z_INDEX: 50,
  /* 动画持续时间（毫秒） */
  POPUP_SLOW_DURATION: 500,
} as const;

/**
 * 布局样式常量。
 * @description 提供常用固定像素字符串，减少样式拼接重复。
 */
export const LAYOUT_STYLE_CONSTANTS = {
  /** 零像素值 */
  ZERO_PX: '0px',
  /** 偏好设置步进器宽度 */
  PREFERENCES_STEPPER_WIDTH_PX: '165px',
  /** 偏好设置步进器间距 */
  PREFERENCES_STEPPER_GAP_PX: '12px',
} as const;

/**
 * 图标尺寸像素值（px）
 * @description 用于需要精确像素值的场景（如内联样式）
 */
export const LAYOUT_ICON_SIZE_PX = {
  xs: 12,
  sm: 16,
  md: 18,
  lg: 20,
  xl: 24,
} as const;

/**
 * 旋转角度常量（度）。
 * @description 供动画与图标旋转逻辑统一使用的数值角度。
 */
export const ROTATION_ANGLES = {
  DEG_0: 0,
  DEG_45: 45,
  DEG_90: 90,
  DEG_180: 180,
  DEG_270: 270,
} as const;

/**
 * 旋转角度 CSS 值。
 * @description 与 `ROTATION_ANGLES` 对应的字符串值，便于直接写入样式。
 */
export const ROTATION_CSS = {
  DEG_0: '0deg',
  DEG_45: '45deg',
  DEG_90: '90deg',
  DEG_180: '180deg',
  DEG_270: '270deg',
} as const;
