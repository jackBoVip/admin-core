import { resolvePageTransitionSnapshot } from '@admin-core/layout';
import { computed } from 'vue';
import { useLayoutContext } from '../use-layout-context';

/**
 * 解析页面切换动画配置。
 * @returns 切换动画启用状态、动画名与加载表现配置。
 */
export function usePageTransition() {
  /**
   * 布局上下文
   * @description 提供转场配置来源。
   */
  const context = useLayoutContext();

  /**
   * 页面切换动画配置。
   */
  const config = computed(() => context.props.transition || {});
  /**
   * 页面切换动画派生快照。
   */
  const snapshot = computed(() => resolvePageTransitionSnapshot(config.value));

  return {
    enabled: computed(() => snapshot.value.enabled),
    transitionName: computed(() => snapshot.value.transitionName),
    showProgress: computed(() => snapshot.value.showProgress),
    showLoading: computed(() => snapshot.value.showLoading),
    config,
  };
}
