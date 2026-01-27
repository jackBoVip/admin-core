/**
 * 动画常量
 */

import type { PageTransitionType } from '../types';

/**
 * 页面切换动画选项
 * @description labelKey 和 descriptionKey 使用 i18n key，需要在 UI 层翻译
 */
export const PAGE_TRANSITION_OPTIONS: Array<{
  labelKey: string;
  value: PageTransitionType;
  descriptionKey: string;
}> = [
  { labelKey: 'transition.nameFade', value: 'fade', descriptionKey: 'transition.nameFadeDesc' },
  { labelKey: 'transition.nameFadeSlide', value: 'fade-slide', descriptionKey: 'transition.nameFadeSlideDesc' },
  { labelKey: 'transition.nameFadeUp', value: 'fade-up', descriptionKey: 'transition.nameFadeUpDesc' },
  { labelKey: 'transition.nameFadeDown', value: 'fade-down', descriptionKey: 'transition.nameFadeDownDesc' },
  { labelKey: 'transition.nameSlideLeft', value: 'slide-left', descriptionKey: 'transition.nameSlideLeftDesc' },
  { labelKey: 'transition.nameSlideRight', value: 'slide-right', descriptionKey: 'transition.nameSlideRightDesc' },
];

/**
 * 动画时长常量 (ms)
 */
export const ANIMATION_DURATION = {
  /** 快速动画 */
  fast: 150,
  /** 正常动画 */
  normal: 300,
  /** 慢速动画 */
  slow: 500,
} as const;

/**
 * 动画时长类型
 */
export type AnimationDurationType = keyof typeof ANIMATION_DURATION;

/**
 * 缓动函数常量
 */
export const ANIMATION_EASING = {
  /** 默认缓动 */
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** 加速缓动 */
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  /** 减速缓动 */
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  /** 弹性缓动 */
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

/**
 * 获取动画时长
 * @param type - 动画时长类型
 * @returns 时长（毫秒）
 */
export function getAnimationDuration(type: AnimationDurationType): number {
  return ANIMATION_DURATION[type];
}

/**
 * 获取动画时长 CSS 值
 * @param type - 动画时长类型
 * @returns CSS 时长值（如 '300ms'）
 */
export function getAnimationDurationCss(type: AnimationDurationType): string {
  return `${ANIMATION_DURATION[type]}ms`;
}
