import { createRouter, createWebHistory } from 'vue-router';
import {
  createVueRouteAccess,
  type RouteModule,
  type RouteRecordStringComponent,
} from '@admin-core/layout-vue';

import RouteView from '../layouts/RouteView.vue';
import { staticRoutes } from './static-routes';
import { fetchMenuList } from './menu-api';

const router = createRouter({
  history: createWebHistory(),
  routes: [],
});

/**
 * 设置路由访问
 * @description
 * 支持三种路由来源的自动合并：
 * 1. 静态路由（staticRoutes）- 基础路由，如首页、关于页
 * 2. 路由模块（routeModules）- 自动扫描 routes/modules 下的模块文件
 * 3. 动态路由（fetchMenuList）- 后端 API 返回的路由
 *
 * 合并顺序：静态 -> 模块 -> 动态（后面的会覆盖前面的同名路由）
 */
export async function setupRouteAccess() {
  // 自动扫描视图组件
  const pageMap = import.meta.glob('/src/views/**/*.vue');

  // 自动扫描路由模块（类似常见 admin 模板的 modules 路由扫描）
  const routeModules = import.meta.glob('./modules/**/*.ts', { eager: true }) as Record<
    string,
    RouteModule<RouteRecordStringComponent[]>
  >;

  const { menus } = await createVueRouteAccess({
    router,
    // 静态路由常量（基础路由）
    staticRoutes,
    // 路由模块自动扫描（类似常见 admin 模板的模块化路由）
    routeModules,
    // 动态菜单 API（后端返回的路由）
    fetchMenuList,
    pageMap,
    viewsRoot: '/src/views',
    layoutMap: {
      LAYOUT: RouteView,
    },
  });

  return { menus };
}

export default router;
