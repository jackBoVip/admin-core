import { resolvePageTransitionSnapshot } from '@admin-core/layout';
import { useMemo } from 'react';
import { useLayoutContext } from '../use-layout-context';

/**
 * 解析页面切换动画配置。
 * @returns 切换动画启用状态、动画名与加载表现配置。
 */
export function usePageTransition() {
  const context = useLayoutContext();

  /**
   * 页面切换动画配置。
   */
  const config = useMemo(() => context.props.transition || {}, [context.props.transition]);
  /**
   * 页面切换动画派生快照。
   */
  const snapshot = useMemo(() => resolvePageTransitionSnapshot(config), [config]);

  return {
    enabled: snapshot.enabled,
    transitionName: snapshot.transitionName,
    showProgress: snapshot.showProgress,
    showLoading: snapshot.showLoading,
    config,
  };
}
