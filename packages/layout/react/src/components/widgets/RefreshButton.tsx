/**
 * 刷新按钮组件
 * @description 刷新当前页面
 */
import { memo } from 'react';
import { useRefresh } from '../../hooks';
import { renderLayoutIcon } from '../../utils';

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
      {renderLayoutIcon('refresh', 'sm', undefined, spinStyle)}
    </button>
  );
});
