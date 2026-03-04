/**
 * Shared React 虚拟列表滚动 Hook。
 * @description 统一管理滚动偏移、滚轮行为与边界修正逻辑，减少组件重复实现。
 */
import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
  type UIEvent,
  type WheelEvent,
} from 'react';

/**
 * 虚拟列表滚动 Hook 参数。
 * @description 定义滚动容器与可视区尺寸，用于统一虚拟列表滚动行为。
 * @template TElement 列表容器元素类型。
 */
export interface UseVirtualListScrollOptions<TElement extends HTMLElement> {
  /** 面板是否处于展开状态。 */
  isOpen: boolean;
  /** 列表容器引用。 */
  listRef: RefObject<TElement | null>;
  /** 虚拟列表总高度。 */
  totalHeight: number;
  /** 列表可视高度。 */
  viewportHeight: number;
}

/**
 * 虚拟列表滚动 Hook 返回值。
 * @description 提供当前滚动偏移、偏移写入函数与滚动事件处理器。
 */
export interface UseVirtualListScrollReturn<TElement extends HTMLElement> {
  /** 当前滚动偏移。 */
  scrollTop: number;
  /** 手动写入滚动偏移。 */
  setScrollTop: Dispatch<SetStateAction<number>>;
  /** 原生滚动事件处理器。 */
  handleScroll: (e: UIEvent<TElement>) => void;
  /** 原生滚轮事件处理器。 */
  handleWheel: (e: WheelEvent<TElement>) => void;
}

/**
 * 统一处理虚拟列表滚动状态与滚轮行为。
 *
 * @template TElement 列表容器元素类型。
 * @param options Hook 参数。
 * @returns 滚动状态与滚动事件处理器集合。
 */
export function useVirtualListScroll<TElement extends HTMLElement>(
  options: UseVirtualListScrollOptions<TElement>
): UseVirtualListScrollReturn<TElement> {
  const { isOpen, listRef, totalHeight, viewportHeight } = options;
  const [scrollTop, setScrollTop] = useState(0);

  /**
   * 处理原生滚动事件并同步 `scrollTop`。
   *
   * @param e 滚动事件对象。
   * @returns 无返回值。
   */
  const handleScroll = useCallback((e: UIEvent<TElement>) => {
    const nextTop = e.currentTarget.scrollTop;
    setScrollTop((prev) => (prev === nextTop ? prev : nextTop));
  }, []);

  /**
   * 处理滚轮事件并驱动容器滚动。
   * @description 忽略 `Ctrl + 滚轮` 缩放场景，防止误拦截浏览器缩放。
   *
   * @param e 滚轮事件对象。
   * @returns 无返回值。
   */
  const handleWheel = useCallback((e: WheelEvent<TElement>) => {
    if (e.ctrlKey) return;
    e.preventDefault();
    const target = e.currentTarget;
    target.scrollTop += e.deltaY;
    const nextTop = target.scrollTop;
    setScrollTop((prev) => (prev === nextTop ? prev : nextTop));
  }, []);

  useEffect(() => {
    if (isOpen) return;
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
    setScrollTop((prev) => (prev === 0 ? prev : 0));
  }, [isOpen, listRef]);

  useEffect(() => {
    if (!isOpen) return;
    const maxScrollTop = Math.max(0, totalHeight - viewportHeight);
    if (scrollTop <= maxScrollTop) return;
    const nextTop = Math.max(0, maxScrollTop);
    if (listRef.current) {
      listRef.current.scrollTop = nextTop;
    }
    setScrollTop((prev) => (prev === nextTop ? prev : nextTop));
  }, [isOpen, totalHeight, viewportHeight, scrollTop, listRef]);

  return {
    scrollTop,
    setScrollTop,
    handleScroll,
    handleWheel,
  };
}
