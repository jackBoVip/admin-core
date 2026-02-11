import { resolvePageTransitionSnapshot } from '@admin-core/layout';
import { useMemo } from 'react';
import { useLayoutContext } from '../use-layout-context';

export function usePageTransition() {
  const context = useLayoutContext();

  const config = useMemo(() => context.props.transition || {}, [context.props.transition]);
  const snapshot = useMemo(() => resolvePageTransitionSnapshot(config), [config]);

  return {
    enabled: snapshot.enabled,
    transitionName: snapshot.transitionName,
    showProgress: snapshot.showProgress,
    showLoading: snapshot.showLoading,
    config,
  };
}
