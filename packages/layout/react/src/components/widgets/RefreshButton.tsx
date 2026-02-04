/**
 * 刷新按钮组件
 * @description 刷新当前页面
 */
import { memo } from 'react';
import { useRefresh } from '../../hooks';

export const RefreshButton = memo(function RefreshButton() {
  const { isRefreshing, refresh } = useRefresh();

  const spinStyle = isRefreshing
    ? {
        animation:
          'spin var(--admin-duration-slow, 500ms) var(--admin-easing-default, ease-in-out)',
        transition: 'none',
      }
    : undefined;

  return (
    <button
      type="button"
      className="header-widget-btn"
      data-state={isRefreshing ? 'refreshing' : 'idle'}
      onClick={refresh}
    >
      <svg
        className="h-4 w-4"
        style={spinStyle}
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
