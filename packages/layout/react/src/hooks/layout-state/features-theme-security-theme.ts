import {
  createLayoutThemeSystemRuntime,
  resolveThemeSnapshot,
  resolveThemeToggleTargetMode,
  type ThemeConfig,
} from '@admin-core/layout';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLayoutContext } from '../use-layout-context';

/**
 * 管理主题模式与系统深色联动。
 * @description 解析主题配置，监听系统主题变化，并提供主题切换动作。
 * @returns 主题快照、系统状态及主题切换函数。
 */
export function useTheme() {
  const context = useLayoutContext();

  /**
   * 主题配置（空值兜底为空对象）。
   */
  const config = useMemo<ThemeConfig>(() => context.props.theme || {}, [context.props.theme]);
  /**
   * 当前主题模式（light/dark/auto）。
   */
  const mode = config.mode || 'light';

  const [systemDark, setSystemDark] = useState(
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
  );

  /**
   * 主题派生快照。
   */
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

  /**
   * 切换主题模式并通知外部。
   */
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
