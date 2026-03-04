import {
  buildLayoutPreferencesSnapshot,
  createLayoutPreferencesSyncRuntime,
  resolveAllLayoutCSSVariables,
  type BasicLayoutProps,
} from '@admin-core/layout';
import { getPreferencesManager } from '@admin-core/preferences-react';
import { useEffect, useMemo, useState } from 'react';
import { useLayoutContext, useLayoutState } from '../use-layout-context';

/**
 * 汇总当前布局对应的全部 CSS 变量。
 * @returns 可直接注入样式系统的 CSS 变量键值对。
 */
export function useAllCSSVariables() {
  const context = useLayoutContext();
  const [state] = useLayoutState();

  /**
   * 当前布局完整 CSS 变量映射。
   */
  const variables = useMemo(() => {
    return resolveAllLayoutCSSVariables(context.props, state);
  }, [context.props, state]);

  return variables;
}

/**
 * 订阅偏好设置并生成布局配置快照。
 * @returns 偏好配置、合并后布局配置及派生区域配置。
 */
export function useLayoutPreferences() {
  const context = useLayoutContext();
  const [preferencesProps, setPreferencesProps] = useState<Partial<BasicLayoutProps>>({});
  /**
   * 偏好同步运行时，负责订阅偏好管理器并回写配置。
   */
  const runtime = useMemo(
    () =>
      createLayoutPreferencesSyncRuntime({
        createManager: () => getPreferencesManager(),
        onChange: setPreferencesProps,
      }),
    []
  );

  useEffect(() => {
    runtime.start();
    return () => runtime.destroy();
  }, [runtime]);

  const snapshot = useMemo(
    () => buildLayoutPreferencesSnapshot(preferencesProps, context.props),
    [preferencesProps, context.props]
  );

  const {
    mergedProps,
    layoutType,
    themeMode,
    isDark,
    sidebarConfig,
    headerConfig,
    tabbarConfig,
    footerConfig,
  } = snapshot;

  return {
    preferencesProps,
    mergedProps,
    layoutType,
    themeMode,
    isDark,
    sidebarConfig,
    headerConfig,
    tabbarConfig,
    footerConfig,
  };
}
