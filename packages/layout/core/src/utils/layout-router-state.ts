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

/**
 * 当前路由路径解析选项。
 */
export interface ResolveLayoutRouterCurrentPathOptions {
  /** 路由层当前路径。 */
  routerCurrentPath?: CurrentPathValue;
  /** 业务层当前路径。 */
  currentPath?: CurrentPathValue;
  /** 路由位置对象。 */
  location?: LocationPathLike | null;
  /** 路由模式。 */
  mode?: 'hash' | 'history';
}

/**
 * 统一解析布局路由当前路径。
 * @param options 路径解析参数。
 * @returns 优先级合并后的当前路径字符串。
 */
export function resolveLayoutRouterCurrentPath(
  options: ResolveLayoutRouterCurrentPathOptions
): string {
  return resolvePreferredCurrentPath(options);
}

/**
 * 路由导航动作创建选项。
 */
export interface LayoutRouterNavigationOptions {
  /** 获取当前路径。 */
  getCurrentPath: () => string;
  /** 路由跳转函数。 */
  routerNavigate?: RouterNavigateFunction;
  /** 是否自动激活子路由。 */
  autoActivateChild?: boolean | (() => boolean | undefined);
}

/**
 * 路由导航动作集合。
 */
export interface LayoutRouterNavigation extends NavigationHandlers {
  /** 原始导航函数。 */
  navigate: RouterNavigateFunction;
}

/**
 * 路由状态控制器创建选项。
 */
export interface LayoutRouterStateControllerOptions {
  /** 获取路由层当前路径。 */
  getRouterCurrentPath: () => CurrentPathValue | undefined;
  /** 获取业务层当前路径。 */
  getCurrentPath: () => CurrentPathValue | undefined;
  /** 获取路由位置对象。 */
  getLocation: () => LocationPathLike | null | undefined;
  /** 获取路由模式。 */
  getMode: () => 'hash' | 'history' | undefined;
  /** 获取路由跳转函数。 */
  getRouterNavigate: () => RouterNavigateFunction | undefined;
  /** 获取自动激活子路由开关。 */
  getAutoActivateChild: () => boolean | undefined;
}

/**
 * 路由状态控制器。
 */
export interface LayoutRouterStateController extends LayoutRouterNavigation {
  /** 获取最终解析后的当前路径。 */
  getResolvedCurrentPath: () => string;
}

/**
 * 创建布局路由导航动作（菜单/标签/面包屑）。
 * @param options 导航动作创建参数。
 * @returns 路由导航动作集合。
 */
export function createLayoutRouterNavigation(
  options: LayoutRouterNavigationOptions
): LayoutRouterNavigation {
  /**
   * 对外统一导航函数，内部转发至框架路由实现。
   * @param path 目标路径。
   * @param navOptions 导航选项。
   */
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
 * 创建布局路由状态控制器（currentPath + 导航动作）。
 * @param options 路由状态控制器创建参数。
 * @returns 路由状态控制器。
 */
export function createLayoutRouterStateController(
  options: LayoutRouterStateControllerOptions
): LayoutRouterStateController {
  /**
   * 读取当前路由上下文并解析出最终 currentPath。
   * @returns 标准化后的当前路径。
   */
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

/**
 * 路径 query 对象。
 */
export type PathQuery = Record<string, string>;

/**
 * 将 query 对象合并到路径中。
 * @param path 目标路径（可包含 query/hash）。
 * @param query 待合并 query 对象；值为 `null/undefined` 时会删除对应参数。
 * @returns 合并后的完整路径。
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

/** 路径拆分结果。 */
export interface PathAndQuery {
  /** 不包含 query/hash 的纯路径部分。 */
  path: string;
  /** 解析后的 query 参数。 */
  query?: PathQuery;
}

/**
 * 从路径中提取 pathname 与 query。
 * @param path 原始路径字符串。
 * @returns 拆分结果，包含 pathname 与可选 query。
 */
export function extractPathAndQuery(path: string): PathAndQuery {
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
