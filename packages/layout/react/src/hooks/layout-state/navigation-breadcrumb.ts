/**
 * 面包屑状态 Hook。
 * @description 统一管理面包屑展示数据、点击导航和子菜单解析能力。
 */
import {
  createLayoutBreadcrumbStateController,
  resolveBreadcrumbChildItems,
  resolveBreadcrumbStateSnapshot,
  type BreadcrumbItem,
} from '@admin-core/layout';
import { useCallback, useMemo } from 'react';
import { useLayoutContext } from '../use-layout-context';
import { useRouter } from './router';

/**
 * 面包屑状态快照类型。
 * @description 由 `resolveBreadcrumbStateSnapshot` 返回值推导，保持与 core 层实现一致。
 */
type BreadcrumbStateSnapshot = ReturnType<typeof resolveBreadcrumbStateSnapshot>;

/**
 * `useBreadcrumbState` 返回值。
 */
export interface UseBreadcrumbStateReturn {
  /** 当前面包屑列表。 */
  breadcrumbs: BreadcrumbStateSnapshot['breadcrumbs'];
  /** 是否启用自动面包屑模式。 */
  isAutoMode: BreadcrumbStateSnapshot['isAutoMode'];
  /** 是否显示图标。 */
  showIcon: BreadcrumbStateSnapshot['showIcon'];
  /** 面包屑样式类型。 */
  styleType: BreadcrumbStateSnapshot['styleType'];
  /** 处理面包屑点击。 */
  handleClick: (item: BreadcrumbItem) => void;
  /** 解析面包屑子级候选菜单。 */
  resolveChildren: (item: BreadcrumbItem) => ReturnType<typeof resolveBreadcrumbChildItems>;
}

/**
 * 管理面包屑状态与交互。
 * @returns 面包屑列表、展示配置及点击处理方法。
 */
export function useBreadcrumbState(): UseBreadcrumbStateReturn {
  /**
   * 布局上下文。
   */
  const context = useLayoutContext();
  /**
   * 路由能力中的面包屑跳转方法。
   */
  const { currentPath, handleBreadcrumbClick: navigateBreadcrumb } = useRouter();

  /**
   * 面包屑运行时快照，包含展示数据与模式配置。
   */
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
    [
      context.props.breadcrumbs,
      currentPath,
      context.props.autoBreadcrumb,
      context.props.breadcrumb,
      context.props.defaultHomePath,
      context.t,
    ]
  );

  /**
   * 面包屑交互控制器，统一处理点击导航与事件派发。
   */
  const controller = useMemo(
    () =>
      createLayoutBreadcrumbStateController({
        navigateBreadcrumb,
        onBreadcrumbClick: context.events.onBreadcrumbClick,
      }),
    [navigateBreadcrumb, context.events]
  );

  /**
   * 处理面包屑项点击。
   *
   * @param item 被点击的面包屑项。
   */
  const handleClick = useCallback(
    (item: BreadcrumbItem) => controller.handleClick(item),
    [controller]
  );

  /**
   * 解析面包屑项可切换的子级候选菜单。
   *
   * @param item 当前面包屑项。
   * @returns 子级菜单集合。
   */
  const resolveChildren = useCallback(
    (item: BreadcrumbItem) =>
      resolveBreadcrumbChildItems({
        item,
        menus: context.props.menus,
        currentPath,
      }),
    [context.props.menus, currentPath]
  );

  return {
    breadcrumbs: snapshot.breadcrumbs,
    isAutoMode: snapshot.isAutoMode,
    showIcon: snapshot.showIcon,
    styleType: snapshot.styleType,
    handleClick,
    resolveChildren,
  };
}

/**
 * 说明：主题、水印、锁屏等状态 Hook 已拆分到独立模块维护。
 * @description 当前文件仅负责面包屑导航状态。
 */
