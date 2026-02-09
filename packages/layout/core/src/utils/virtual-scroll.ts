/**
 * 虚拟滚动工具函数
 * @description 用于计算虚拟滚动的可见范围
 */

export interface VirtualScrollRange {
  startIndex: number;
  endIndex: number;
  visibleCount: number;
}

export interface VirtualScrollOptions {
  scrollTop: number;
  viewportHeight: number;
  itemHeight: number;
  totalItems: number;
  overscan?: number;
}

/**
 * 计算虚拟滚动的可见范围
 * @param options - 虚拟滚动选项
 * @returns 虚拟滚动范围
 */
export function calculateVirtualRange(options: VirtualScrollOptions): VirtualScrollRange {
  const {
    scrollTop,
    viewportHeight,
    itemHeight,
    totalItems,
    overscan = 4,
  } = options;

  if (itemHeight <= 0 || viewportHeight <= 0 || totalItems <= 0) {
    return {
      startIndex: 0,
      endIndex: 0,
      visibleCount: 0,
    };
  }

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalItems,
    Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan
  );
  const visibleCount = Math.max(0, endIndex - startIndex);

  return {
    startIndex,
    endIndex,
    visibleCount,
  };
}

/**
 * 判断是否应该启用虚拟滚动
 * @param options - 判断选项
 * @returns 是否应该启用虚拟滚动
 */
export function shouldVirtualize(options: {
  enabled: boolean;
  viewportHeight: number;
  itemHeight: number;
  totalItems: number;
}): boolean {
  const { enabled, viewportHeight, itemHeight, totalItems } = options;
  
  if (!enabled) return false;
  if (viewportHeight <= 0 || itemHeight <= 0) return false;
  
  // 如果总高度小于视口高度，不需要虚拟滚动
  const totalHeight = totalItems * itemHeight;
  return totalHeight > viewportHeight;
}

