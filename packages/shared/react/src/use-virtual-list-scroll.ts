import { useCallback, useEffect, useState, type RefObject } from 'react';

export interface UseVirtualListScrollOptions<TElement extends HTMLElement> {
  isOpen: boolean;
  listRef: RefObject<TElement | null>;
  totalHeight: number;
  viewportHeight: number;
}

export function useVirtualListScroll<TElement extends HTMLElement>(
  options: UseVirtualListScrollOptions<TElement>
) {
  const { isOpen, listRef, totalHeight, viewportHeight } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback((e: React.UIEvent<TElement>) => {
    const nextTop = e.currentTarget.scrollTop;
    setScrollTop((prev) => (prev === nextTop ? prev : nextTop));
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<TElement>) => {
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
