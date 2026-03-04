/**
 * 布局面包屑状态 Composable（Vue）。
 * @description 统一管理面包屑展示数据、点击导航和子菜单解析能力。
 */
import {
  createLayoutBreadcrumbStateController,
  resolveBreadcrumbChildItems,
  resolveBreadcrumbStateSnapshot,
  type BreadcrumbItem,
} from '@admin-core/layout';
import { computed, type ComputedRef } from 'vue';
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
  breadcrumbs: ComputedRef<BreadcrumbStateSnapshot['breadcrumbs']>;
  /** 是否启用自动面包屑模式。 */
  isAutoMode: ComputedRef<BreadcrumbStateSnapshot['isAutoMode']>;
  /** 是否显示图标。 */
  showIcon: ComputedRef<BreadcrumbStateSnapshot['showIcon']>;
  /** 面包屑样式类型。 */
  styleType: ComputedRef<BreadcrumbStateSnapshot['styleType']>;
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
   * 布局上下文
   * @description 提供菜单、面包屑配置与点击事件回调。
   */
  const context = useLayoutContext();
  /**
   * 路由面包屑联动能力
   * @description 提供当前路径与面包屑导航处理函数。
   */
  const { currentPath, handleBreadcrumbClick: navigateBreadcrumb } = useRouter();

  /**
   * 面包屑运行时快照，包含展示列表与样式策略。
   */
  const snapshot = computed(() =>
    resolveBreadcrumbStateSnapshot({
      breadcrumbs: context.props.breadcrumbs,
      currentPath: currentPath.value,
      menus: context.props.menus,
      autoBreadcrumb: context.props.autoBreadcrumb,
      breadcrumb: context.props.breadcrumb,
      defaultHomePath: context.props.defaultHomePath,
      translatedHomeName: context.t('layout.breadcrumb.home'),
    })
  );

  /**
   * 面包屑交互控制器，统一处理点击导航与事件派发。
   */
  const controller = createLayoutBreadcrumbStateController({
    navigateBreadcrumb,
    onBreadcrumbClick: context.events.onBreadcrumbClick,
  });

  /**
   * 处理面包屑点击，执行内置导航与事件派发。
   *
   * @param item 被点击面包屑项。
   */
  const handleClick = (item: BreadcrumbItem) => {
    controller.handleClick(item);
  };

  /**
   * 解析面包屑项对应的子菜单候选列表。
   *
   * @param item 面包屑项。
   * @returns 子菜单项数组。
   */
  const resolveChildren = (item: BreadcrumbItem) =>
    resolveBreadcrumbChildItems({
      item,
      menus: context.props.menus,
      currentPath: currentPath.value,
    });

  return {
    breadcrumbs: computed(() => snapshot.value.breadcrumbs),
    isAutoMode: computed(() => snapshot.value.isAutoMode),
    showIcon: computed(() => snapshot.value.showIcon),
    styleType: computed(() => snapshot.value.styleType),
    handleClick,
    resolveChildren,
  };
}
