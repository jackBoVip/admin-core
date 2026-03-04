/**
 * 路由访问构建器（Vue）。
 * @description 自动生成路由与菜单，并注入到 Vue Router。
 */

import {
  createRouteAccess,
  type GenerateRoutesOptions,
  type MenuItem,
  type RouteAccessResult,
} from '@admin-core/layout';
import type { Router, RouteRecordRaw } from 'vue-router';

/**
 * 路由访问构建参数（Vue）。
 */
export interface VueRouteAccessOptions
  extends Omit<GenerateRoutesOptions<RouteRecordRaw['component']>, 'pageMap'> {
  /** 路由实例（Vue）。 */
  router: Router;
  /** 视图组件映射表（由应用侧 `import.meta.glob` 生成）。 */
  pageMap: Record<string, RouteRecordRaw['component']>;
  /** 根路由路径（默认 `/`）。 */
  routerRootPath?: string;
}

/**
 * 路由访问构建结果（Vue）。
 */
export interface VueRouteAccessResult
  extends RouteAccessResult<RouteRecordRaw['component']> {
  /** 回滚本次动态注入路由。 */
  resetRoutes: () => void;
  /** 对应生成的菜单列表。 */
  menus: MenuItem[];
}

/**
 * 创建 Vue 路由访问控制结果并动态注入路由。
 *
 * @param options 构建配置。
 * @returns 路由与菜单结果及回滚函数。
 */
export async function createVueRouteAccess(
  options: VueRouteAccessOptions
): Promise<VueRouteAccessResult> {
  const {
    router,
    pageMap,
    routerRootPath = '/',
    ...coreOptions
  } = options;

  const { routes, menus } = await createRouteAccess({
    ...coreOptions,
    pageMap,
  });

  /**
   * 本次动态注入的路由名称集合。
   * @description 用于在 `resetRoutes` 时执行回滚删除。
   */
  const addedRouteNames: string[] = [];
  /**
   * 根布局路由记录
   * @description 命中后将普通页面路由作为其子路由注入。
   */
  const root = router.getRoutes().find((route) => route.path === routerRootPath);
  /**
   * 根布局路由名称
   * @description 仅在存在根路由且具名时用于 `addRoute(parentName, route)`。
   */
  const rootName = root?.name;

  for (const route of routes) {
    const record = route as unknown as RouteRecordRaw;
    const name = record.name ? String(record.name) : undefined;

    if (name && typeof router.hasRoute === 'function' && router.hasRoute(name)) {
      router.removeRoute(name);
    }

    if (rootName && !(record.meta as Record<string, unknown> | undefined)?.noBasicLayout) {
      router.addRoute(rootName, record);
    } else {
      router.addRoute(record);
    }

    if (name) {
      addedRouteNames.push(name);
    }
  }

  /**
   * 回滚本次动态注入的路由记录。
   */
  const resetRoutes = () => {
    addedRouteNames.forEach((name) => {
      try {
        router.removeRoute(name);
      } catch {
        /* ignore */
      }
    });
  };

  return { routes, menus, resetRoutes };
}
