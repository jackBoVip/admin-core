import {
  createLayoutDynamicTitleController,
  getCachedMenuPathIndex,
  resolveDynamicTitleSnapshot,
} from '@admin-core/layout';
import { EMPTY_MENUS } from '@admin-core/layout-shared';
import { useCallback, useEffect, useMemo } from 'react';
import { useLayoutContext } from '../use-layout-context';
import { useRouter } from './router';

export function useDynamicTitle() {
  const context = useLayoutContext();
  const { currentPath } = useRouter();

  const enabled = context.props.dynamicTitle !== false;
  const appName = context.props.appName || '';
  const menus =
    context.props.menus && context.props.menus.length > 0 ? context.props.menus : EMPTY_MENUS;
  const menuIndex = useMemo(() => getCachedMenuPathIndex(menus), [menus]);
  const titleSnapshot = useMemo(
    () =>
      resolveDynamicTitleSnapshot({
        enabled,
        appName,
        menuIndex,
        currentPath,
      }),
    [enabled, appName, menuIndex, currentPath]
  );
  const controller = useMemo(
    () =>
      createLayoutDynamicTitleController({
        getEnabled: () => enabled,
        getAppName: () => appName,
        setDocumentTitle: (title) => {
          if (typeof document !== 'undefined') {
            document.title = title;
          }
        },
      }),
    [enabled, appName]
  );

  const updateTitle = useCallback(
    (pageTitle?: string) => controller.updateTitle(pageTitle),
    [controller]
  );

  useEffect(() => {
    controller.applyTitle(titleSnapshot.title);
  }, [controller, titleSnapshot.title]);

  return {
    enabled,
    appName,
    updateTitle,
  };
}
