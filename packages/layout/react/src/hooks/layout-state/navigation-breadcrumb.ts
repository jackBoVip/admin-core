import {
  createLayoutBreadcrumbStateController,
  resolveBreadcrumbStateSnapshot,
  type BreadcrumbItem,
} from '@admin-core/layout';
import { useCallback, useMemo } from 'react';
import { useLayoutContext } from '../use-layout-context';
import { useRouter } from './router';

export function useBreadcrumbState() {
  const context = useLayoutContext();
  const { currentPath, handleBreadcrumbClick: navigateBreadcrumb } = useRouter();

  const snapshot = useMemo(
    () =>
      resolveBreadcrumbStateSnapshot({
      breadcrumbs: context.props.breadcrumbs,
      currentPath,
      menus: context.props.menus,
      autoBreadcrumb: context.props.autoBreadcrumb,
      breadcrumb: context.props.breadcrumb,
      defaultHomePath: context.props.defaultHomePath,
      translatedHomeName: context.t('layout.breadcrumb.home'),
      }),
    [context.props.breadcrumbs, currentPath, context.props.autoBreadcrumb, context.props.breadcrumb, context.props.defaultHomePath, context.t]
  );

  const controller = useMemo(
    () =>
      createLayoutBreadcrumbStateController({
        navigateBreadcrumb,
        onBreadcrumbClick: context.events.onBreadcrumbClick,
      }),
    [navigateBreadcrumb, context.events]
  );

  const handleClick = useCallback(
    (item: BreadcrumbItem) => controller.handleClick(item),
    [controller]
  );

  return {
    breadcrumbs: snapshot.breadcrumbs,
    isAutoMode: snapshot.isAutoMode,
    showIcon: snapshot.showIcon,
    styleType: snapshot.styleType,
    handleClick,
  };
}

// ============================================================
// 主题、水印、锁屏等功能
// ============================================================

/**
 * 使用主题
 */
