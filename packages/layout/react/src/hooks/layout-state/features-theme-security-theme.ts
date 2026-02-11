import {
  createLayoutThemeSystemRuntime,
  resolveThemeSnapshot,
  resolveThemeToggleTargetMode,
  type ThemeConfig,
} from '@admin-core/layout';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLayoutContext } from '../use-layout-context';

export function useTheme() {
  const context = useLayoutContext();

  const config = useMemo<ThemeConfig>(() => context.props.theme || {}, [context.props.theme]);
  const mode = config.mode || 'light';

  const [systemDark, setSystemDark] = useState(
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
  );

  const snapshot = useMemo(() => resolveThemeSnapshot(config, systemDark), [config, systemDark]);
  const isAutoRef = useRef(snapshot.isAuto);
  isAutoRef.current = snapshot.isAuto;

  const themeRuntime = useMemo(
    () =>
      createLayoutThemeSystemRuntime({
        getEnabled: () => isAutoRef.current,
        setSystemDark: (value) => {
          setSystemDark((prev) => (prev === value ? prev : value));
        },
      }),
    []
  );

  useEffect(() => {
    themeRuntime.start();
    return () => {
      themeRuntime.destroy();
    };
  }, [themeRuntime]);

  useEffect(() => {
    themeRuntime.sync();
  }, [themeRuntime, snapshot.isAuto]);

  const toggleTheme = useCallback(() => {
    context.events.onThemeToggle?.(resolveThemeToggleTargetMode(mode));
  }, [mode, context.events]);

  return {
    config,
    mode: snapshot.mode,
    isDark: snapshot.isDark,
    isAuto: snapshot.isAuto,
    actualMode: snapshot.actualMode,
    cssVariables: snapshot.cssVariables,
    cssClasses: snapshot.cssClasses,
    isGrayMode: snapshot.isGrayMode,
    isWeakMode: snapshot.isWeakMode,
    systemDark,
    toggleTheme,
  };
}
