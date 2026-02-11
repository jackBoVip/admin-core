import {
  createLayoutResponsiveStateController,
  TIMING,
} from '@admin-core/layout';
import { useEffect, useMemo, useRef, useState } from 'react';

export function useResponsive() {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : TIMING.defaultWindowWidth
  );
  const widthRef = useRef(width);
  widthRef.current = width;
  const controller = useMemo(
    () =>
      createLayoutResponsiveStateController({
        getWidth: () => widthRef.current,
        setWidth: (nextWidth) => {
          widthRef.current = nextWidth;
          setWidth(nextWidth);
        },
      }),
    []
  );
  const snapshot = useMemo(() => controller.getSnapshot(), [controller, width]);

  useEffect(() => {
    controller.start();
    return () => {
      controller.destroy();
    };
  }, [controller]);

  return {
    width: snapshot.width,
    isMobile: snapshot.isMobile,
    isTablet: snapshot.isTablet,
    isDesktop: snapshot.isDesktop,
    breakpoint: snapshot.breakpoint,
  };
}
