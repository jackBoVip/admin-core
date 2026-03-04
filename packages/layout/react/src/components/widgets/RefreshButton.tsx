/**
 * 刷新按钮组件
 * @description 刷新当前页面
 */
import { memo } from 'react';
import { useRefresh } from '../../hooks';
import { renderLayoutIcon } from '../../utils';

/**
 * 刷新按钮组件。
 * @description 触发页面刷新动作，并在刷新期间展示旋转状态。
 */
export const RefreshButton = memo(function RefreshButton() {
  /**
   * 刷新状态与刷新方法。
   * @description 由布局刷新 Hook 提供，统一处理节流与动画状态。
   */
  const { isRefreshing, refresh } = useRefresh();

  /**
   * 刷新图标旋转样式，仅在刷新中生效。
   */
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
