import {
  createLayoutCheckUpdatesRuntime,
  resolveCheckUpdatesEnabled,
} from '@admin-core/layout';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLayoutContext } from '../use-layout-context';

export function useCheckUpdates(checkFn?: () => Promise<boolean>) {
  const context = useLayoutContext();

  const config = useMemo(() => context.props.checkUpdates || {}, [context.props.checkUpdates]);
  const enabled = resolveCheckUpdatesEnabled(config);
  const [hasUpdate, setHasUpdate] = useState(false);
  const configRef = useRef(config);
  configRef.current = config;
  const checkFnRef = useRef(checkFn);
  checkFnRef.current = checkFn;

  const runtime = useMemo(
    () =>
      createLayoutCheckUpdatesRuntime({
        getConfig: () => configRef.current,
        getCheckFn: () => checkFnRef.current,
        onUpdate: (nextValue) => {
          setHasUpdate(nextValue);
        },
      }),
    []
  );

  useEffect(() => {
    runtime.start();
    return () => {
      runtime.destroy();
    };
  }, [runtime]);

  useEffect(() => {
    runtime.sync();
  }, [runtime, enabled, checkFn, config]);

  return {
    enabled,
    hasUpdate,
    config,
  };
}
