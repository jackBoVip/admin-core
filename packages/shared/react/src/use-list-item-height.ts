/**
 * Shared React 列表项高度监听 Hook。
 * @description 监听首项高度变化并同步缓存高度，支撑虚拟列表的高度计算稳定性。
 */
import { useEffect, useRef, type RefObject } from 'react';

/**
 * 列表项高度监听 Hook 参数。
 * @description 描述列表容器、监听状态与高度回写策略，用于虚拟列表高度同步。
 * @template TElement 列表容器元素类型。
 */
export interface UseListItemHeightOptions<TElement extends HTMLElement> {
  /** 面板是否处于展开状态。 */
  isOpen: boolean;
  /** 列表容器引用。 */
  listRef: RefObject<TElement | null>;
  /** 当前记录的单项高度。 */
  itemHeight: number;
  /** 当前列表项数量。 */
  itemCount: number;
  /** 写入最新单项高度。 */
  setItemHeight: (height: number) => void;
  /** 用于查找首个列表项的选择器。 */
  itemSelector?: string;
}

/**
 * 监听列表首项高度变化并同步到状态。
 *
 * @template TElement 列表容器元素类型。
 * @param options Hook 参数。
 * @returns 无返回值。
 */
export function useListItemHeight<TElement extends HTMLElement>(
  options: UseListItemHeightOptions<TElement>
) {
  const {
    isOpen,
    listRef,
    itemHeight,
    itemCount,
    setItemHeight,
    itemSelector = '.layout-list-item',
  } = options;
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const list = listRef.current;
    if (!list) return;

    /**
     * 测量并同步首个列表项高度。
     *
     * @returns 无返回值。
     */
    const updateItemHeight = () => {
      const firstItem = list.querySelector(itemSelector) as HTMLElement | null;
      if (!firstItem) return;
      const height = firstItem.getBoundingClientRect().height;
      if (height > 0 && height !== itemHeight) {
        setItemHeight(height);
      }
    };

    const frame = requestAnimationFrame(updateItemHeight);

    if (typeof ResizeObserver !== 'undefined') {
      const firstItem = list.querySelector(itemSelector) as HTMLElement | null;
      if (firstItem) {
        const observer = new ResizeObserver(updateItemHeight);
        observer.observe(firstItem);
        resizeObserverRef.current = observer;
      }
    }

    return () => {
      cancelAnimationFrame(frame);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    };
  }, [isOpen, itemCount, itemHeight, itemSelector, listRef, setItemHeight]);
}
