/**
 * Vue 路由访问构建器
 * @description 自动生成路由 + 菜单，并注入到 Vue Router
 */

import {
  createRouteAccess,
  type GenerateRoutesOptions,
  type MenuItem,
  type RouteAccessResult,
} from '@admin-core/layout';
import type { Router, RouteRecordRaw } from 'vue-router';


export interface VueRouteAccessOptions
  extends Omit<GenerateRoutesOptions<RouteRecordRaw['component']>, 'pageMap'> {
  /** Vue Router 实例 */
  router: Router;
  /** 视图组件映射表（由应用侧 import.meta.glob 生成） */
  pageMap: Record<string, RouteRecordRaw['component']>;
  /** 根路由路径（默认 /） */
  routerRootPath?: string;
}

export interface VueRouteAccessResult
  extends RouteAccessResult<RouteRecordRaw['component']> {
  resetRoutes: () => void;
  menus: MenuItem[];
}

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

  const addedRouteNames: string[] = [];
  const root = router.getRoutes().find((route) => route.path === routerRootPath);
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

  const resetRoutes = () => {
    addedRouteNames.forEach((name) => {
      try {
        router.removeRoute(name);
      } catch {
        // ignore
      }
    });
  };

  return { routes, menus, resetRoutes };
}
