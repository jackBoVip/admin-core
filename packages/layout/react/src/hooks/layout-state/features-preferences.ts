import {
  buildLayoutPreferencesSnapshot,
  createLayoutPreferencesSyncRuntime,
  resolveAllLayoutCSSVariables,
  type BasicLayoutProps,
} from '@admin-core/layout';
import { getPreferencesManager } from '@admin-core/preferences-react';
import { useEffect, useMemo, useState } from 'react';
import { useLayoutContext, useLayoutState } from '../use-layout-context';

export function useAllCSSVariables() {
  const context = useLayoutContext();
  const [state] = useLayoutState();

  const variables = useMemo(() => {
    return resolveAllLayoutCSSVariables(context.props, state);
  }, [context.props, state]);

  return variables;
}

export function useLayoutPreferences() {
  const context = useLayoutContext();
  const [preferencesProps, setPreferencesProps] = useState<Partial<BasicLayoutProps>>({});
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
