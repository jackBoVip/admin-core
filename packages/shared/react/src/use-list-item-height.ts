import { useEffect, useRef, type RefObject } from 'react';

export interface UseListItemHeightOptions<TElement extends HTMLElement> {
  isOpen: boolean;
  listRef: RefObject<TElement | null>;
  itemHeight: number;
  itemCount: number;
  setItemHeight: (height: number) => void;
  itemSelector?: string;
}

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
