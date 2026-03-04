/**
 * 路由访问构建器（React）。
 * @description 生成 React Router `RouteObject[]` 与菜单数据。
 */

import {
  createRouteAccess,
  type GenerateRoutesOptions,
  type MenuItem,
  type RouteAccessResult,
  type RouteRecord,
} from '@admin-core/layout';
import React, { createElement } from 'react';

/**
 * 页面模块默认导出结构（React）。
 */
interface ReactDefaultExportComponentModule {
  /** 模块默认导出组件。 */
  default?: React.ComponentType;
}

/**
 * 跳转组件属性（React Router `Navigate`）。
 */
interface ReactNavigateProps {
  /** 目标路径。 */
  to: string;
  /** 是否替换当前历史记录。 */
  replace?: boolean;
}

/**
 * 页面组件映射值类型（React）。
 */
type ReactPageMapValue =
  | React.ComponentType
  | React.LazyExoticComponent<React.ComponentType>
  | ReactDefaultExportComponentModule
  | (() => Promise<ReactDefaultExportComponentModule | React.ComponentType>);

/**
 * 路由访问构建参数（React）。
 */
export interface ReactRouteAccessOptions
  extends Omit<GenerateRoutesOptions<React.ComponentType>, 'pageMap'> {
  /** 视图组件映射表（由应用侧构建）。 */
  pageMap: Record<string, ReactPageMapValue>;
  /** 路由组件集合（由应用侧传入，避免多实例上下文问题）。 */
  routerComponents?: {
    /** 跳转组件。 */
    Navigate?: React.ComponentType<ReactNavigateProps>;
    /** 子路由出口组件。 */
    Outlet?: React.ComponentType;
  };
}

/**
 * 路由访问构建结果（React）。
 */
export interface ReactRouteAccessResult extends RouteAccessResult<React.ComponentType> {
  /** 菜单列表。 */
  menus: MenuItem[];
  /** 路由对象列表（RouteObject）。 */
  routeObjects: RouteObject[];
}

/**
 * 路由重定向兜底组件。
 * @description 当调用方未注入 `Navigate` 组件时返回空节点，避免退化为整页刷新。
 */
function RedirectFallback() {
  return null;
}

/**
 * 兼容 React Router 的路由对象类型定义。
 */
export type RouteObject =
  | {
      /** 路由路径。 */
      path?: string;
      /** 路由元素。 */
      element?: React.ReactNode;
      /** 子节点列表。 */
      children?: RouteObject[];
      /** 附加 handle 信息。 */
      handle?: unknown;
      /** 索引。 */
      index?: false;
    }
  | {
      /** 索引。 */
      index: true;
      /** 路由元素。 */
      element?: React.ReactNode;
      /** 附加 handle 信息。 */
      handle?: unknown;
    };

/**
 * 类组件原型结构（React）。
 */
interface ReactClassPrototype {
  /** 是否 React class 组件。 */
  isReactComponent?: boolean;
}

/**
 * 可包含类组件原型的组件结构。
 */
interface ReactComponentWithPrototype {
  /** 原型对象。 */
  prototype?: ReactClassPrototype;
}

/**
 * 组件对象内部类型标识结构（React）。
 */
interface ReactTypeofTagged {
  /** 框架内部类型标记符号。 */
  $$typeof?: unknown;
}

/**
 * 判断值是否为 class 组件。
 * @param value 待判断值。
 * @returns 是否 class 组件。
 */
function isClassComponent(value: unknown): value is React.ComponentType {
  return (
    typeof value === 'function'
    && !!(value as ReactComponentWithPrototype).prototype?.isReactComponent
  );
}

/**
 * 判断值是否可作为 React 组件渲染。
 * @param value 待判断值。
 * @returns 是否可渲染。
 */
function isReactRenderable(value: unknown): value is React.ComponentType {
  if (!value) return false;
  if (typeof value === 'function') return true;
  if (typeof value === 'object' && '$$typeof' in (value as Record<string, unknown>)) return true;
  return false;
}

/**
 * 判断值是否为 React.lazy 组件。
 * @param value 待判断值。
 * @returns 是否 lazy 组件。
 */
function isLazyComponent(value: unknown): value is React.LazyExoticComponent<React.ComponentType> {
  if (!value || typeof value !== 'object') return false;
  const lazySymbol = Symbol.for('react.lazy');
  return (value as ReactTypeofTagged).$$typeof === lazySymbol;
}

/**
 * 判断函数是否为动态导入函数。
 * @param value 待判断值。
 * @returns 是否动态导入函数。
 */
function isImportFunction(value: unknown): value is () => Promise<unknown> {
  if (typeof value !== 'function') return false;
  if (value.name.includes('/')) return true;
  const source = Function.prototype.toString.call(value);
  return (
    source.includes('import(') ||
    source.includes('__vite_ssr_dynamic_import__') ||
    source.includes('__vitePreload(') ||
    (source.includes('Promise.resolve().then') && source.includes('require('))
  );
}

/**
 * 标准化页面映射值为 React 组件。
 * @param value 页面映射值。
 * @returns React 组件。
 */
function normalizeReactComponent(value: ReactPageMapValue | undefined): React.ComponentType | undefined {
  if (!value) return undefined;
  if (isLazyComponent(value)) return value as React.ComponentType;
  if (typeof value === 'object' && 'default' in value && value.default) {
    return value.default as React.ComponentType;
  }
  if (typeof value === 'function') {
    if (isImportFunction(value)) {
      return React.lazy(async () => {
        const mod = await value();
        if (mod && typeof mod === 'object' && 'default' in (mod as Record<string, unknown>)) {
          const resolved = (mod as {
            /** 模块默认导出组件。 */
            default?: React.ComponentType;
          }).default;
          return { default: resolved ?? (() => null) };
        }
        const fallback = mod as React.ComponentType;
        return { default: fallback ?? (() => null) };
      });
    }
    if (isClassComponent(value)) {
      return value as React.ComponentType;
    }
    return value as React.ComponentType;
  }
  if (isReactRenderable(value)) {
    return value as React.ComponentType;
  }
  return undefined;
}

/**
 * 标准化页面映射表（React）。
 * @param pageMap 原始映射表。
 * @returns 标准化映射表。
 */
function normalizeReactPageMap(pageMap: Record<string, ReactPageMapValue>): Record<string, React.ComponentType> {
  const normalized: Record<string, React.ComponentType> = {};
  for (const [key, value] of Object.entries(pageMap)) {
    const component = normalizeReactComponent(value);
    if (component) {
      normalized[key] = component;
    }
  }
  return normalized;
}

/**
 * 规范化父级路径。
 * @param path 原始路径。
 * @returns 规范化路径。
 */
function normalizeParentPath(path: string): string {
  if (!path) return '';
  return path
    .replace(/\/\*+$/, '')
    .replace(/\*+$/, '')
    .replace(/\/+$/, '');
}

/**
 * 规范化子路由路径。
 * @param path 当前路由路径。
 * @param parentPath 父路由路径。
 * @returns 规范化后的路径。
 */
function normalizeRoutePath(path: string | undefined, parentPath: string): string | undefined {
  if (!path) return path;
  const base = normalizeParentPath(parentPath);
  let nextPath = path.replace(/\/\*$/, '');

  if (nextPath.startsWith('/') && base) {
    if (nextPath.startsWith(base)) {
      let relative = nextPath.slice(base.length);
      if (relative.startsWith('/')) relative = relative.slice(1);
      nextPath = relative;
    } else {
      nextPath = nextPath.replace(/^\/+/, '');
    }
  }

  return nextPath;
}

/**
 * 拼接父子路径。
 * @param base 父路径。
 * @param segment 子路径。
 * @returns 拼接后的路径。
 */
function joinPaths(base: string, segment: string): string {
  if (!segment) return normalizeParentPath(base);
  if (segment.startsWith('/')) return normalizeParentPath(segment);
  const normalizedBase = normalizeParentPath(base);
  if (!normalizedBase) return `/${segment}`.replace(/\/+$/, '');
  return normalizeParentPath(`${normalizedBase}/${segment}`);
}

/**
 * 将路由记录树转换为 React Router `RouteObject[]`。
 * @param routes 路由记录树。
 * @param NavigateComp Navigate 组件。
 * @param OutletComp Outlet 组件。
 * @param parentPath 父路径。
 * @returns RouteObject 列表。
 */
function toReactRouteObjects(
  routes: RouteRecord<React.ComponentType>[],
  NavigateComp?: React.ComponentType<ReactNavigateProps>,
  OutletComp?: React.ComponentType,
  parentPath = ''
): RouteObject[] {
  return routes.map((route) => {
    /**
     * 当前路由是否包含子路由。
     */
    const hasChildren = !!route.children?.length;
    /**
     * 当前层级规范化路径。
     */
    const path = normalizeRoutePath(route.path, parentPath);
    let element: React.ReactElement | undefined;

    if (route.component) {
      const resolvedComponent = normalizeReactComponent(route.component);
      if (resolvedComponent) {
        const rawElement = createElement(resolvedComponent);
        element = isLazyComponent(resolvedComponent)
          ? createElement(React.Suspense, { fallback: null }, rawElement)
          : rawElement;
      }
    }

    /**
     * 下一级路由拼接基础路径。
     */
    const nextBase = path ? joinPaths(parentPath, path) : normalizeParentPath(parentPath);
    /**
     * 子路由对象集合。
     */
    let children = route.children
      ? toReactRouteObjects(route.children, NavigateComp, OutletComp, nextBase)
      : undefined;

    if (hasChildren) {
      if (!element && OutletComp) {
        element = createElement(OutletComp);
      }
      if (route.redirect) {
        const RedirectComponent = NavigateComp || RedirectFallback;
        const redirectRoute: RouteObject = {
          index: true,
          element: createElement(RedirectComponent, { to: route.redirect, replace: true }),
        };
        children = children ? [redirectRoute, ...children] : [redirectRoute];
      }
    } else if (route.redirect) {
      const RedirectComponent = NavigateComp || RedirectFallback;
      element = createElement(RedirectComponent, { to: route.redirect, replace: true });
    }
    /**
     * 路由元信息，透传到 React Router `handle` 字段。
     */
    const handle = route.meta ? { meta: route.meta } : undefined;

    return {
      path,
      element,
      children,
      handle,
    };
  });
}

/**
 * 规范化 React 路由树（处理相对路径与绝对路径关系）。
 * @param routes 路由记录树。
 * @param parentPath 父路径。
 * @returns 规范化后的路由树。
 */
function normalizeReactRouteTree(
  routes: RouteRecord<React.ComponentType>[],
  parentPath = ''
): RouteRecord<React.ComponentType>[] {
  /**
   * 规范化基础路径（去掉尾部 `/*` 与多余 `/`）。
   * @param path 原始路径。
   * @returns 规范化后的路径。
   */
  const normalizeBasePath = (path: string) =>
    path
      .replace(/\/\*$/, '')
      .replace(/\/+$/, '');

  /**
   * 递归规范化子路由路径，使其与父路径保持相对关系。
   * @param items 子路由列表。
   * @param basePath 当前父级基础路径。
   * @returns 规范化后的子路由列表。
   */
  const normalizeChildren = (
    items: RouteRecord<React.ComponentType>[],
    basePath: string
  ): RouteRecord<React.ComponentType>[] =>
    items.map((route): RouteRecord<React.ComponentType> => {
      let path = route.path ? normalizeBasePath(route.path) : route.path;
      const normalizedBase = basePath === '' ? '' : normalizeBasePath(basePath);
      const shouldRelative = normalizedBase !== '';

      if (path && path.startsWith('/') && shouldRelative) {
        if (path.startsWith(normalizedBase)) {
          let relative = path.slice(normalizedBase.length);
          if (relative.startsWith('/')) relative = relative.slice(1);
          path = relative;
        } else {
          path = path.replace(/^\/+/, '');
        }
      }

      const normalizedCurrent = path ?? route.path ?? '';
      const nextBase = normalizedCurrent
        ? normalizeBasePath(
            normalizedBase
              ? `${normalizedBase}/${normalizedCurrent}`
              : normalizedCurrent.startsWith('/')
                ? normalizedCurrent
                : `/${normalizedCurrent}`
          )
        : normalizedBase;
      const children: RouteRecord<React.ComponentType>[] | undefined = route.children
        ? normalizeChildren(route.children, nextBase)
        : undefined;

      return {
        ...route,
        path,
        children,
      };
    });

  return normalizeChildren(routes, parentPath);
}

/**
 * 创建 React 路由访问构建结果。
 * @param options 构建参数。
 * @returns 构建结果。
 */
export async function createReactRouteAccess(
  options: ReactRouteAccessOptions
): Promise<ReactRouteAccessResult> {
  const { pageMap, routerComponents, ...coreOptions } = options;
  /**
   * 标准化后的组件映射。
   */
  const normalizedPageMap = normalizeReactPageMap(pageMap);
  /**
   * 核心层构建结果（菜单 + 路由记录）。
   */
  const result = await createRouteAccess({
    ...coreOptions,
    pageMap: normalizedPageMap,
  });

  /**
   * 规范化后的路由树。
   */
  const normalizedRoutes = normalizeReactRouteTree(result.routes);
  /**
   * React Router 可消费的路由对象数组。
   */
  const routeObjects = toReactRouteObjects(
    normalizedRoutes,
    routerComponents?.Navigate,
    routerComponents?.Outlet
  );

  return { ...result, routeObjects };
}
