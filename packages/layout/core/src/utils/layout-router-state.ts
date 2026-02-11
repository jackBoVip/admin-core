/**
 * 路由状态公共纯函数
 * @description 提供 React/Vue 共用的 router 导航、路径与 query 解析逻辑
 */

import {
  createNavigationHandlers,
  resolvePreferredCurrentPath,
  type CurrentPathValue,
  type LocationPathLike,
  type NavigationHandlers,
} from './router';
import type { RouterNavigateFunction } from '../types';

export interface ResolveLayoutRouterCurrentPathOptions {
  routerCurrentPath?: CurrentPathValue;
  currentPath?: CurrentPathValue;
  location?: LocationPathLike | null;
  mode?: 'hash' | 'history';
}

/**
 * 统一解析布局路由当前路径
 */
export function resolveLayoutRouterCurrentPath(
  options: ResolveLayoutRouterCurrentPathOptions
): string {
  return resolvePreferredCurrentPath(options);
}

export interface LayoutRouterNavigationOptions {
  getCurrentPath: () => string;
  routerNavigate?: RouterNavigateFunction;
  autoActivateChild?: boolean | (() => boolean | undefined);
}

export interface LayoutRouterNavigation extends NavigationHandlers {
  navigate: RouterNavigateFunction;
}

export interface LayoutRouterStateControllerOptions {
  getRouterCurrentPath: () => CurrentPathValue | undefined;
  getCurrentPath: () => CurrentPathValue | undefined;
  getLocation: () => LocationPathLike | null | undefined;
  getMode: () => 'hash' | 'history' | undefined;
  getRouterNavigate: () => RouterNavigateFunction | undefined;
  getAutoActivateChild: () => boolean | undefined;
}

export interface LayoutRouterStateController extends LayoutRouterNavigation {
  getResolvedCurrentPath: () => string;
}

/**
 * 创建布局路由导航动作（菜单/标签/面包屑）
 */
export function createLayoutRouterNavigation(
  options: LayoutRouterNavigationOptions
): LayoutRouterNavigation {
  const navigate: RouterNavigateFunction = (path, navOptions) => {
    options.routerNavigate?.(path, navOptions);
  };

  const handlers = createNavigationHandlers({
    getCurrentPath: options.getCurrentPath,
    navigate,
    autoActivateChild: options.autoActivateChild,
  });

  return {
    navigate,
    ...handlers,
  };
}

/**
 * 创建布局路由状态控制器（currentPath + 导航动作）
 */
export function createLayoutRouterStateController(
  options: LayoutRouterStateControllerOptions
): LayoutRouterStateController {
  const getResolvedCurrentPath = () =>
    resolveLayoutRouterCurrentPath({
      routerCurrentPath: options.getRouterCurrentPath(),
      currentPath: options.getCurrentPath(),
      location: options.getLocation(),
      mode: options.getMode(),
    });

  const navigation = createLayoutRouterNavigation({
    getCurrentPath: getResolvedCurrentPath,
    routerNavigate: (path, navOptions) => {
      options.getRouterNavigate()?.(path, navOptions);
    },
    autoActivateChild: () => options.getAutoActivateChild(),
  });

  return {
    getResolvedCurrentPath,
    ...navigation,
  };
}

export type PathQuery = Record<string, string>;

/**
 * 将 query 对象合并到路径中
 */
export function applyQueryToPath(path: string, query?: Record<string, unknown>): string {
  if (!path || !query || Object.keys(query).length === 0) {
    return path;
  }

  const hashIndex = path.indexOf('#');
  const pathWithoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const hash = hashIndex >= 0 ? path.slice(hashIndex + 1) : '';

  const queryIndex = pathWithoutHash.indexOf('?');
  const pathname =
    queryIndex >= 0 ? pathWithoutHash.slice(0, queryIndex) : pathWithoutHash;
  const rawSearch = queryIndex >= 0 ? pathWithoutHash.slice(queryIndex + 1) : '';
  const searchParams = new URLSearchParams(rawSearch);

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      searchParams.delete(key);
      continue;
    }
    searchParams.set(key, String(value));
  }

  const nextSearch = searchParams.toString();
  const searchPart = nextSearch ? `?${nextSearch}` : '';
  const hashPart = hash ? `#${hash}` : '';
  return `${pathname}${searchPart}${hashPart}`;
}

/**
 * 从路径中提取 pathname 与 query
 */
export function extractPathAndQuery(path: string): { path: string; query?: PathQuery } {
  if (!path) {
    return { path: '' };
  }

  const hashIndex = path.indexOf('#');
  const pathWithoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const queryIndex = pathWithoutHash.indexOf('?');

  if (queryIndex < 0) {
    return { path: pathWithoutHash };
  }

  const pathname = pathWithoutHash.slice(0, queryIndex);
  const rawSearch = pathWithoutHash.slice(queryIndex + 1);
  if (!rawSearch) {
    return { path: pathname };
  }

  try {
    const entries = new URLSearchParams(rawSearch).entries();
    const query = Object.fromEntries(entries);
    if (Object.keys(query).length === 0) {
      return { path: pathname };
    }
    return { path: pathname, query };
  } catch {
    return { path: pathname };
  }
}
