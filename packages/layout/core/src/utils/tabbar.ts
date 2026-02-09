/**
 * 标签栏滚动工具函数
 * @description 用于处理标签栏滚动相关的逻辑
 */

import { LAYOUT_UI_TOKENS } from '../constants';

/**
 * 计算标签栏滚动偏移量
 * @param containerWidth - 容器宽度
 * @param offsetRatio - 偏移比例（默认使用 LAYOUT_UI_TOKENS.TABBAR_SCROLL_OFFSET_RATIO）
 * @param minOffset - 最小偏移量（默认使用 LAYOUT_UI_TOKENS.TABBAR_SCROLL_MIN_OFFSET）
 * @returns 滚动偏移量
 */
export function calculateTabbarScrollOffset(
  containerWidth: number,
  offsetRatio?: number,
  minOffset?: number
): number {
  const ratio = offsetRatio ?? LAYOUT_UI_TOKENS.TABBAR_SCROLL_OFFSET_RATIO;
  const min = minOffset ?? LAYOUT_UI_TOKENS.TABBAR_SCROLL_MIN_OFFSET;
  
  return Math.max(containerWidth * ratio, min);
}

/**
 * 计算标签栏滚动位置
 * @param options - 滚动选项
 * @returns 滚动位置
 */
export function calculateTabbarScrollPosition(options: {
  containerWidth: number;
  scrollLeft: number;
  targetLeft: number;
  targetWidth: number;
  offsetRatio?: number;
  minOffset?: number;
}): number {
  const { containerWidth, scrollLeft, targetLeft, targetWidth } = options;
  
  // 计算目标元素的右边界
  const targetRight = targetLeft + targetWidth;
  
  // 计算容器的可见区域
  const containerRight = scrollLeft + containerWidth;
  
  // 计算滚动偏移量
  const offset = calculateTabbarScrollOffset(
    containerWidth,
    options.offsetRatio,
    options.minOffset
  );
  
  let newScrollLeft = scrollLeft;
  
  // 如果目标元素在左侧不可见
  if (targetLeft < scrollLeft) {
    newScrollLeft = targetLeft - offset;
  }
  // 如果目标元素在右侧不可见
  else if (targetRight > containerRight) {
    newScrollLeft = targetRight - containerWidth + offset;
  }
  
  return Math.max(0, newScrollLeft);
}
