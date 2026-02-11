import { resolvePageTransitionSnapshot } from '@admin-core/layout';
import { computed } from 'vue';
import { useLayoutContext } from '../use-layout-context';

export function usePageTransition() {
  const context = useLayoutContext();

  const config = computed(() => context.props.transition || {});
  const snapshot = computed(() => resolvePageTransitionSnapshot(config.value));

  return {
    enabled: computed(() => snapshot.value.enabled),
    transitionName: computed(() => snapshot.value.transitionName),
    showProgress: computed(() => snapshot.value.showProgress),
    showLoading: computed(() => snapshot.value.showLoading),
    config,
  };
}
