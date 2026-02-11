import {
  createLayoutShortcutKeyRuntime,
  createShortcutKeydownHandler,
  resolveShortcutEnabled,
} from '@admin-core/layout';
import { useEffect, useMemo, useRef } from 'react';
import { useLayoutContext } from '../use-layout-context';

export function useShortcutKeys() {
  const context = useLayoutContext();

  const config = useMemo(() => context.props.shortcutKeys || {}, [context.props.shortcutKeys]);
  const enabled = resolveShortcutEnabled(config);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const eventsRef = useRef(context.events);
  eventsRef.current = context.events;

  const keydownHandler = useMemo(
    () =>
      createShortcutKeydownHandler({
        getConfig: () => config,
        getHandlers: () => eventsRef.current,
      }),
    [config]
  );

  const runtime = useMemo(
    () =>
      createLayoutShortcutKeyRuntime({
        getEnabled: () => enabledRef.current,
        onKeydown: keydownHandler,
      }),
    [keydownHandler]
  );

  useEffect(() => {
    runtime.start();
    return () => {
      runtime.destroy();
    };
  }, [runtime]);

  useEffect(() => {
    runtime.sync();
  }, [runtime, enabled]);

  return {
    enabled,
    config,
  };
}
