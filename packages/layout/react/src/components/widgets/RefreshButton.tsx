/**
 * 刷新按钮组件
 * @description 刷新当前页面
 */
import { useState, useCallback, useEffect, useRef, memo } from 'react';
import { useLayoutContext } from '../../hooks';

export const RefreshButton = memo(function RefreshButton() {
  const { events, t } = useLayoutContext();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRefresh = useCallback(() => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    events.onRefresh?.();

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  }, [isRefreshing, events]);

  useEffect(() => () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return (
    <button
      type="button"
      className={`header-widget-btn ${isRefreshing ? 'animate-spin' : ''}`}
      title={t('layout.header.refresh')}
      data-state={isRefreshing ? 'refreshing' : 'idle'}
      onClick={handleRefresh}
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
        <path d="M16 16h5v5" />
      </svg>
    </button>
  );
});
