import {
  createLayoutAutoLockRuntime,
  resolveLockScreenSnapshot,
  type LockScreenConfig,
} from '@admin-core/layout';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLayoutContext } from '../use-layout-context';

export function useLockScreen() {
  const context = useLayoutContext();

  const config = useMemo<LockScreenConfig>(() => context.props.lockScreen || {}, [context.props.lockScreen]);
  const snapshot = useMemo(() => resolveLockScreenSnapshot(config), [config]);
  const configRef = useRef(config);
  configRef.current = config;

  const lock = useCallback(() => {
    context.events.onLockScreen?.();
  }, [context.events]);

  const runtime = useMemo(
    () =>
      createLayoutAutoLockRuntime({
        getConfig: () => configRef.current,
        onLock: lock,
      }),
    [lock]
  );

  useEffect(() => {
    runtime.start();
    return () => {
      runtime.destroy();
    };
  }, [runtime]);

  useEffect(() => {
    runtime.sync();
  }, [runtime, config]);

  return {
    isLocked: snapshot.isLocked,
    backgroundImage: snapshot.backgroundImage,
    showUserInfo: snapshot.showUserInfo,
    showClock: snapshot.showClock,
    showDate: snapshot.showDate,
    config,
    lock,
  };
}
