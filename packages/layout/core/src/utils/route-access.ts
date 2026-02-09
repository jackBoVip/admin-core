/**
 * 路由访问构建工具
 * @description 静态路由 + 动态菜单 API 合并，生成路由与菜单
 */

import type {
  GenerateRoutesOptions,
  MenuItem,
  RouteAccessResult,
  RouteMeta,
  RouteModule,
  RouteRecord,
  RouteRecordStringComponent,
} from '../types';

/**
 * 规范化视图路径
 * - 统一使用 `/` 开头
 * - 移除相对路径前缀
 * - 移除文件扩展名
 * - 可选移除 viewsRoot 前缀
 */
export function normalizeViewPath(path: string, viewsRoot?: string): string {
  if (!path) return '';
  let normalized = path.replace(/\\/g, '/').trim();
  normalized = normalized.replace(/^(\.\/|\.\.\/)+/g, '');
  if (!normalized.startsWith('/')) normalized = `/${normalized}`;

  if (viewsRoot) {
    let root = viewsRoot.replace(/\\/g, '/');
    if (!root.startsWith('/')) root = `/${root}`;
    if (normalized.startsWith(root)) {
      normalized = normalized.slice(root.length);
      if (!normalized.startsWith('/')) normalized = `/${normalized}`;
    }
  }

  normalized = normalized.replace(/\.(vue|tsx|jsx|ts|js)$/i, '');
  return normalized;
}

/**
 * 规范化 pageMap（支持 index 别名）
 */
export function normalizePageMap<TComponent = unknown>(
  pageMap: Record<string, TComponent>,
  viewsRoot?: string
): Record<string, TComponent> {
  const normalized: Record<string, TComponent> = {};
  for (const [key, value] of Object.entries(pageMap)) {
    const normalizedKey = normalizeViewPath(key, viewsRoot);
    if (!(normalizedKey in normalized)) {
      normalized[normalizedKey] = value;
    }
    if (normalizedKey.endsWith('/index')) {
      const alias = normalizedKey.slice(0, -'/index'.length) || '/';
      if (!(alias in normalized)) {
        normalized[alias] = value;
      }
    }
  }
  return normalized;
}

/**
 * 判断是否为外链
 */
function isExternalLink(link?: string): boolean {
  if (!link) return false;
  return /^https?:\/\//i.test(link);
}

/**
 * 根据 component 字符串解析真实组件
 */
export function resolveComponentFromMap<TComponent = unknown>(
  component: unknown,
  pageMap: Record<string, TComponent>,
  layoutMap?: Record<string, TComponent>,
  viewsRoot?: string
): TComponent | undefined {
  if (!component) return undefined;
  if (typeof component !== 'string') {
    return component as TComponent;
  }
  if (layoutMap && component in layoutMap) {
    return layoutMap[component];
  }

  const normalizedMap = normalizePageMap(pageMap, viewsRoot);
  const normalizedPath = normalizeViewPath(component, viewsRoot);
  if (normalizedPath in normalizedMap) {
    return normalizedMap[normalizedPath];
  }
  const indexPath = `${normalizedPath}/index`;
  if (indexPath in normalizedMap) {
    return normalizedMap[indexPath];
  }

  return undefined;
}

/**
 * 将 component=string 的路由转换为真实组件路由
 */
function resolveRouteRecords<TComponent = unknown>(
  routes: RouteRecordStringComponent[],
  pageMap: Record<string, TComponent>,
  layoutMap?: Record<string, TComponent>,
  viewsRoot?: string
): RouteRecord<TComponent>[] {
  return routes.map((route) => {
    const resolvedComponent = resolveComponentFromMap(
      route.component,
      pageMap,
      layoutMap,
      viewsRoot
    );
    const children = route.children
      ? resolveRouteRecords(route.children, pageMap, layoutMap, viewsRoot)
      : undefined;

    return {
      ...route,
      component: resolvedComponent,
      children,
    };
  });
}

/**
 * 合并路由模块
 * @description 支持多种导出格式：{ default: [] }、[]、() => []
 */
export async function mergeRouteModules(
  routeModules: Record<string, RouteModule<RouteRecordStringComponent[]>>
): Promise<RouteRecordStringComponent[]> {
  const mergedRoutes: RouteRecordStringComponent[] = [];

  for (const routeModule of Object.values(routeModules)) {
    let moduleRoutes: RouteRecordStringComponent[] = [];

    if (routeModule === null || routeModule === undefined) {
      continue;
    }

    // 处理 { default: [] } 格式
    if (typeof routeModule === 'object' && routeModule !== null && 'default' in routeModule) {
      const defaultExport = (routeModule as { default: RouteRecordStringComponent[] | (() => RouteRecordStringComponent[] | Promise<RouteRecordStringComponent[]>) }).default;
      if (Array.isArray(defaultExport)) {
        moduleRoutes = defaultExport;
      } else if (typeof defaultExport === 'function') {
        const result = await defaultExport();
        moduleRoutes = Array.isArray(result) ? result : [];
      }
    }
    // 处理直接数组格式
    else if (Array.isArray(routeModule)) {
      moduleRoutes = routeModule;
    }
    // 处理函数格式
    else if (typeof routeModule === 'function') {
      const result = await routeModule();
      moduleRoutes = Array.isArray(result) ? result : [];
    }

    if (moduleRoutes.length > 0) {
      mergedRoutes.push(...moduleRoutes);
    }
  }

  return mergedRoutes;
}

/**
 * 动态生成路由 - 后端方式
 */
export async function generateRoutesFromBackend<TComponent = unknown>(
  options: GenerateRoutesOptions<TComponent>
): Promise<RouteRecord<TComponent>[]> {
  const { fetchMenuList, pageMap = {}, layoutMap, viewsRoot } = options;
  const menuRoutes = await fetchMenuList?.();
  if (!menuRoutes) return [];

  return resolveRouteRecords(menuRoutes, pageMap, layoutMap, viewsRoot);
}

/**
 * 从路由模块生成路由
 */
export async function generateRoutesFromModules<TComponent = unknown>(
  options: GenerateRoutesOptions<TComponent>
): Promise<RouteRecord<TComponent>[]> {
  const { routeModules, pageMap = {}, layoutMap, viewsRoot } = options;
  if (!routeModules) return [];

  const moduleRoutes = await mergeRouteModules(routeModules);
  if (moduleRoutes.length === 0) return [];

  return resolveRouteRecords(moduleRoutes, pageMap, layoutMap, viewsRoot);
}

/**
 * 合并静态路由与动态路由（同名/同路径动态覆盖静态）
 */
export function mergeStaticRoutes<TComponent = unknown>(
  staticRoutes: RouteRecord<TComponent>[],
  dynamicRoutes: RouteRecord<TComponent>[]
): RouteRecord<TComponent>[] {
  const result = [...staticRoutes];
  const indexMap = new Map<string, number>();

  const getKey = (route: RouteRecord<TComponent>) =>
    route.name || route.path || '';

  result.forEach((route, index) => {
    const key = getKey(route);
    if (key) indexMap.set(key, index);
  });

  function mergeRoute(
    baseRoute: RouteRecord<TComponent>,
    overrideRoute: RouteRecord<TComponent>
  ): RouteRecord<TComponent> {
    const merged: RouteRecord<TComponent> = {
      ...baseRoute,
      ...overrideRoute,
    };
    if (baseRoute.children || overrideRoute.children) {
      merged.children = mergeStaticRoutes(
        baseRoute.children || [],
        overrideRoute.children || []
      );
    }
    return merged;
  }

  for (const route of dynamicRoutes) {
    const key = getKey(route);
    const idx = indexMap.get(key);
    if (idx !== undefined) {
      result[idx] = mergeRoute(result[idx], route);
    } else {
      indexMap.set(key, result.length);
      result.push(route);
    }
  }

  return result;
}

/**
 * 注入默认 redirect（没有 redirect 且子路由路径为绝对时）
 */
export function injectDefaultRedirects<TComponent = unknown>(
  routes: RouteRecord<TComponent>[]
): RouteRecord<TComponent>[] {
  return routes.map((route) => {
    const children = route.children ? injectDefaultRedirects(route.children) : undefined;
    const next: RouteRecord<TComponent> = { ...route, children };

    if (!next.redirect && children && children.length > 0) {
      const firstChild = children[0];
      if (firstChild?.path && firstChild.path.startsWith('/')) {
        next.redirect = firstChild.path;
      }
    }
    return next;
  });
}

/**
 * 生成菜单（基于 meta）
 */
export function generateMenusFromRoutes<TComponent = unknown>(
  routes: RouteRecord<TComponent>[]
): MenuItem[] {
  const buildMenus = (
    items: RouteRecord<TComponent>[],
    parentPath?: string
  ): MenuItem[] => {
    const menus: MenuItem[] = [];

    for (const route of items) {
      const meta = (route.meta || {}) as RouteMeta;
      const name = (meta.title || route.name || '') as string;
      const key = String(route.name || route.path || name || '');
      const path = route.path || '';

      const hideChildren = !!meta.hideChildrenInMenu;
      const children = hideChildren
        ? []
        : route.children
        ? buildMenus(route.children, path)
        : undefined;

      const externalLink = meta.link && isExternalLink(meta.link) ? meta.link : undefined;

      const menuItem: MenuItem = {
        key: key || path,
        name,
        icon: meta.icon,
        activeIcon: meta.activeIcon,
        path,
        hidden: !!meta.hideInMenu,
        hideInBreadcrumb: !!meta.hideInBreadcrumb,
        hideInTab: !!meta.hideInTab,
        badge: meta.badge,
        badgeType: meta.badgeType,
        badgeDot: meta.badgeDot,
        externalLink,
        openInNewWindow: externalLink ? true : undefined,
        children,
        meta: {
          order: meta.order,
          parentPath,
        },
      };

      menus.push(menuItem);
    }

    // 排序
    menus.sort((a, b) => {
      const orderA = (a.meta as { order?: number } | undefined)?.order ?? 999;
      const orderB = (b.meta as { order?: number } | undefined)?.order ?? 999;
      return orderA - orderB;
    });

    // 过滤隐藏
    return menus.filter((menu) => !menu.hidden);
  };

  return buildMenus(routes);
}

/**
 * 创建路由访问结果
 * @description 自动合并：静态路由 + 路由模块 + 动态菜单 API
 * 
 * 合并顺序：
 * 1. 静态路由（staticRoutes）- 基础路由
 * 2. 路由模块（routeModules）- 自动扫描的路由文件
 * 3. 动态路由（fetchMenuList）- 后端 API 返回的路由
 * 
 * 同名/同路径的路由，后面的会覆盖前面的
 */
export async function createRouteAccess<TComponent = unknown>(
  options: GenerateRoutesOptions<TComponent>
): Promise<RouteAccessResult<TComponent>> {
  const { staticRoutes = [], pageMap = {}, layoutMap, viewsRoot, transformRoutes } = options;

  // 1. 解析静态路由
  const resolvedStatic = resolveRouteRecords(staticRoutes, pageMap, layoutMap, viewsRoot);

  // 2. 从路由模块生成路由（自动扫描 modules/**/*.ts）
  const moduleRoutes = await generateRoutesFromModules(options);

  // 3. 从后端 API 生成路由
  const dynamicRoutes = await generateRoutesFromBackend(options);

  // 4. 合并路由：静态 -> 模块 -> 动态（后面的覆盖前面的）
  let mergedRoutes = mergeStaticRoutes(resolvedStatic, moduleRoutes);
  mergedRoutes = mergeStaticRoutes(mergedRoutes, dynamicRoutes);
  
  // 5. 注入默认 redirect
  mergedRoutes = injectDefaultRedirects(mergedRoutes);

  // 6. 应用自定义转换
  if (transformRoutes) {
    mergedRoutes = await transformRoutes(mergedRoutes);
  }

  // 7. 生成菜单
  const menus = generateMenusFromRoutes(mergedRoutes);
  return { routes: mergedRoutes, menus };
}
