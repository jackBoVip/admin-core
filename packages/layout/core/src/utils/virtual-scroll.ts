/**
 * 虚拟滚动工具函数
 * @description 用于计算虚拟滚动的可见范围
 */

/**
 * 虚拟滚动可见范围结果。
 */
export interface VirtualScrollRange {
  /** 当前渲染窗口的起始索引（包含）。 */
  startIndex: number;
  /** 当前渲染窗口的结束索引（不包含）。 */
  endIndex: number;
  /** 当前窗口应渲染的条目数量。 */
  visibleCount: number;
}

/**
 * 虚拟滚动范围计算参数。
 */
export interface VirtualScrollOptions {
  /** 当前滚动容器的 `scrollTop`。 */
  scrollTop: number;
  /** 滚动容器可视高度。 */
  viewportHeight: number;
  /** 单条目固定高度。 */
  itemHeight: number;
  /** 列表数据。 */
  totalItems: number;
  /** 额外预渲染条目数，减少滚动白屏。 */
  overscan?: number;
}

/**
 * 计算虚拟滚动的可见范围。
 * @param options 虚拟滚动参数。
 * @returns 虚拟滚动范围。
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

/** 虚拟滚动启用判定参数。 */
export interface ShouldVirtualizeOptions {
  /** 是否启用。 */
  enabled: boolean;
  /** 滚动容器可视高度。 */
  viewportHeight: number;
  /** 单条目固定高度。 */
  itemHeight: number;
  /** 列表数据。 */
  totalItems: number;
}

/**
 * 判断是否应该启用虚拟滚动。
 * @param options 判定参数。
 * @returns 是否应启用虚拟滚动。
 */
export function shouldVirtualize(options: ShouldVirtualizeOptions): boolean {
  const { enabled, viewportHeight, itemHeight, totalItems } = options;

  if (!enabled) return false;
  if (viewportHeight <= 0 || itemHeight <= 0) return false;

  /* 如果总高度小于视口高度，不需要虚拟滚动。 */
  const totalHeight = totalItems * itemHeight;
  return totalHeight > viewportHeight;
}
