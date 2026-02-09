/**
 * 动画相关常量
 * @description 统一管理动画相关的常量值
 */

/**
 * 动画持续时间（毫秒）
 */
export const ANIMATION_DURATIONS = {
  /** 快速动画（150ms） */
  FAST: 150,
  /** 正常动画（300ms） */
  NORMAL: 300,
  /** 慢速动画（500ms） */
  SLOW: 500,
} as const;

/**
 * 动画持续时间 CSS 值
 */
export const ANIMATION_DURATIONS_CSS = {
  FAST: '150ms',
  NORMAL: '300ms',
  SLOW: '500ms',
} as const;

/**
 * 动画变换常量（像素）
 */
export const ANIMATION_TRANSFORMS = {
  /** 下拉菜单偏移量 */
  DROPDOWN_OFFSET: -4,
  /** 上拉菜单偏移量 */
  DROPUP_OFFSET: 4,
} as const;

/**
 * 动画变换 CSS 值
 */
export const ANIMATION_TRANSFORMS_CSS = {
  DROPDOWN_OFFSET: '-4px',
  DROPUP_OFFSET: '4px',
} as const;

/**
 * 动画缓动函数
 */
export const ANIMATION_EASING = {
  /** 线性 */
  LINEAR: 'linear',
  /** 缓入 */
  EASE_IN: 'ease-in',
  /** 缓出 */
  EASE_OUT: 'ease-out',
  /** 缓入缓出 */
  EASE_IN_OUT: 'ease-in-out',
  /** 默认 */
  EASE: 'ease',
} as const;

