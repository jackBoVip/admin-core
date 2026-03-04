/**
 * 路由状态 Hook（React）。
 * @description 适配应用路由能力并向布局系统暴露统一的导航处理方法。
 */
import {
  applyQueryToPath,
  createLayoutRouterStateController,
  type RouterConfig,
} from '@admin-core/layout';
import { useMemo, useRef } from 'react';
import { useLayoutContext } from '../use-layout-context';

/**
 * React Router 导航参数。
 */
interface ReactRouterNavigateOptions {
  /** 是否替换当前历史记录项。 */
  replace?: boolean;
}

/**
 * 组件侧传入的路由位置信息。
 */
interface ReactRouterLocation {
  /** 当前路径（不包含查询串）。 */
  pathname: string;
  /** 当前查询串（以 `?` 开头）。 */
  search?: string;
}

/**
 * Layout 路由控制器读取的最小 location 结构。
 */
interface LayoutRouterLocation {
  /** 当前路径。 */
  pathname?: string;
  /** 查询字符串。 */
  search?: string;
  /** 哈希片段。 */
  hash?: string;
}

/**
 * 布局路由状态控制器类型。
 * @description 由 `createLayoutRouterStateController` 返回值推导，保持与 core 层实现一致。
 */
type LayoutRouterController = ReturnType<typeof createLayoutRouterStateController>;

/**
 * `useRouter` 返回值。
 */
export interface UseLayoutRouterReturn {
  /** 当前解析后的路径。 */
  currentPath: string;
  /** 执行路由跳转。 */
  navigate: LayoutRouterController['navigate'];
  /** 处理菜单项点击导航。 */
  handleMenuItemClick: LayoutRouterController['handleMenuItemClick'];
  /** 处理标签点击导航。 */
  handleTabClick: LayoutRouterController['handleTabClick'];
  /** 处理面包屑点击导航。 */
  handleBreadcrumbClick: LayoutRouterController['handleBreadcrumbClick'];
  /** 处理标签关闭后的兜底导航。 */
  handleTabCloseNavigate: LayoutRouterController['handleTabCloseNavigate'];
}

/**
 * 将 React Router 的 `navigate/location` 适配为 Layout 通用路由配置。
 *
 * @param navigate React Router 导航函数。
 * @param location React Router 当前位置信息。
 * @returns 可供 `layout` 核心控制器消费的路由配置；参数缺失时返回 `undefined`。
 */
export function useReactRouterAdapter(
  navigate?: (path: string, options?: ReactRouterNavigateOptions) => void,
  location?: ReactRouterLocation
): RouterConfig | undefined {
  if (!navigate || !location) {
    return undefined;
  }

  return {
    navigate: (
      path: string,
      options?: ReactRouterNavigateOptions & { /** 要拼接到路径上的查询参数。 */ query?: Record<string, unknown> }
    ) => {
      const nextPath = applyQueryToPath(path, options?.query);
      navigate(nextPath, { replace: options?.replace });
    },
    currentPath: `${location.pathname}${location.search || ''}`,
    location,
  };
}

/**
 * 暴露布局系统统一路由行为（菜单点击、标签切换、面包屑跳转等）。
 */
export function useRouter(): UseLayoutRouterReturn {
  /**
   * 布局上下文。
   */
  const context = useLayoutContext();
  /**
   * 布局路由配置引用，保证控制器读取到最新路由能力。
   */
  const routerRef = useRef(context.props.router);
  routerRef.current = context.props.router;
  /**
   * 当前路径引用。
   */
  const currentPathRef = useRef(context.props.currentPath);
  currentPathRef.current = context.props.currentPath;
  /**
   * 侧栏子路由自动激活配置引用。
   */
  const autoActivateChildRef = useRef(context.props.sidebar?.autoActivateChild);
  autoActivateChildRef.current = context.props.sidebar?.autoActivateChild;

  /**
   * 布局路由状态控制器。
   */
  const controller = useMemo(
    () =>
      createLayoutRouterStateController({
        getRouterCurrentPath: () => routerRef.current?.currentPath,
        getCurrentPath: () => currentPathRef.current,
        getLocation: () =>
          routerRef.current?.location as
            | LayoutRouterLocation
            | undefined,
        getMode: () => routerRef.current?.mode,
        getRouterNavigate: () => routerRef.current?.navigate,
        getAutoActivateChild: () => autoActivateChildRef.current,
      }),
    []
  );
  /**
   * 当前解析后的路径（优先路由器路径，其次受控路径）。
   */
  const currentPath = controller.getResolvedCurrentPath();

  return {
    currentPath,
    navigate: controller.navigate,
    handleMenuItemClick: controller.handleMenuItemClick,
    handleTabClick: controller.handleTabClick,
    handleBreadcrumbClick: controller.handleBreadcrumbClick,
    handleTabCloseNavigate: controller.handleTabCloseNavigate,
  };
}
