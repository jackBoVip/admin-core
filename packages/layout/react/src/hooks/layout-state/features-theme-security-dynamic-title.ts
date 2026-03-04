import {
  createLayoutDynamicTitleController,
  getCachedMenuPathIndex,
  resolveDynamicTitleSnapshot,
} from '@admin-core/layout';
import { EMPTY_MENUS } from '@admin-core/layout-shared';
import { useCallback, useEffect, useMemo } from 'react';
import { useLayoutContext } from '../use-layout-context';
import { useRouter } from './router';

/**
 * 管理动态标题功能。
 * @returns 动态标题启用状态、应用名与手动更新标题函数。
 */
export function useDynamicTitle() {
  const context = useLayoutContext();
  const { currentPath } = useRouter();

  /**
   * 是否启用动态标题。
   */
  const enabled = context.props.dynamicTitle !== false;
  /**
   * 应用名称。
   */
  const appName = context.props.appName || '';
  const menus =
    context.props.menus && context.props.menus.length > 0 ? context.props.menus : EMPTY_MENUS;
  /**
   * 菜单路径索引缓存。
   */
  const menuIndex = useMemo(() => getCachedMenuPathIndex(menus), [menus]);
  /**
   * 动态标题快照。
   */
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

  /**
   * 手动更新页面标题。
   *
   * @param pageTitle 页面标题文本。
   */
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
