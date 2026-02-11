import { createLayoutFullscreenStateController, logger } from '@admin-core/layout';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLayoutContext } from '../use-layout-context';

export function useFullscreenState() {
  const context = useLayoutContext();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isFullscreenRef = useRef(isFullscreen);
  isFullscreenRef.current = isFullscreen;

  const controller = useMemo(
    () =>
      createLayoutFullscreenStateController({
        getIsFullscreen: () => isFullscreenRef.current,
        setIsFullscreen: (nextValue) => {
          isFullscreenRef.current = nextValue;
          setIsFullscreen((prev) => (prev === nextValue ? prev : nextValue));
        },
        onFullscreenToggle: (nextValue) => {
          context.events.onFullscreenToggle?.(nextValue);
        },
        onError: (error) => {
          logger.error('Fullscreen error:', error);
        },
      }),
    [context.events]
  );

  useEffect(() => {
    controller.start();
    return () => {
      controller.destroy();
    };
  }, [controller]);

  const toggle = useCallback(() => controller.toggle(), [controller]);

  return {
    isFullscreen,
    toggle,
  };
}
