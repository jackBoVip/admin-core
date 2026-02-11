/**
 * React 路由访问构建器
 * @description 生成 RouteObject[] + 菜单
 */

import {
  createRouteAccess,
  type GenerateRoutesOptions,
  type MenuItem,
  type RouteAccessResult,
  type RouteRecord,
} from '@admin-core/layout';
import React, { createElement } from 'react';


type ReactPageMapValue =
  | React.ComponentType
  | React.LazyExoticComponent<React.ComponentType>
  | { default?: React.ComponentType }
  | (() => Promise<{ default?: React.ComponentType } | React.ComponentType>);

export interface ReactRouteAccessOptions
  extends Omit<GenerateRoutesOptions<React.ComponentType>, 'pageMap'> {
  /** 视图组件映射表（由应用侧构建） */
  pageMap: Record<string, ReactPageMapValue>;
  /** React Router 组件（由应用侧传入，避免多实例上下文问题） */
  routerComponents?: {
    Navigate?: React.ComponentType<{ to: string; replace?: boolean }>;
    Outlet?: React.ComponentType;
  };
}

export interface ReactRouteAccessResult extends RouteAccessResult<React.ComponentType> {
  menus: MenuItem[];
  routeObjects: RouteObject[];
}

function RedirectFallback() {
  // Fallback to no-op when Navigate is unavailable (avoid full page reload)
  return null;
}

export type RouteObject =
  | {
      path?: string;
      element?: React.ReactNode;
      children?: RouteObject[];
      handle?: unknown;
      index?: false;
    }
  | {
      index: true;
      element?: React.ReactNode;
      handle?: unknown;
    };

function isClassComponent(value: unknown): value is React.ComponentType {
  return typeof value === 'function' && !!(value as { prototype?: { isReactComponent?: boolean } }).prototype?.isReactComponent;
}

function isReactRenderable(value: unknown): value is React.ComponentType {
  if (!value) return false;
  if (typeof value === 'function') return true;
  if (typeof value === 'object' && '$$typeof' in (value as Record<string, unknown>)) return true;
  return false;
}

function isLazyComponent(value: unknown): value is React.LazyExoticComponent<React.ComponentType> {
  if (!value || typeof value !== 'object') return false;
  const lazySymbol = Symbol.for('react.lazy');
  return (value as { $$typeof?: unknown }).$$typeof === lazySymbol;
}

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
          const resolved = (mod as { default?: React.ComponentType }).default;
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

function normalizeParentPath(path: string): string {
  if (!path) return '';
  return path
    .replace(/\/\*+$/, '')
    .replace(/\*+$/, '')
    .replace(/\/+$/, '');
}

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

function joinPaths(base: string, segment: string): string {
  if (!segment) return normalizeParentPath(base);
  if (segment.startsWith('/')) return normalizeParentPath(segment);
  const normalizedBase = normalizeParentPath(base);
  if (!normalizedBase) return `/${segment}`.replace(/\/+$/, '');
  return normalizeParentPath(`${normalizedBase}/${segment}`);
}

function toReactRouteObjects(
  routes: RouteRecord<React.ComponentType>[],
  NavigateComp?: React.ComponentType<{ to: string; replace?: boolean }>,
  OutletComp?: React.ComponentType,
  parentPath = ''
): RouteObject[] {
  return routes.map((route) => {
    const hasChildren = !!route.children?.length;
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

    const nextBase = path ? joinPaths(parentPath, path) : normalizeParentPath(parentPath);
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
    const handle = route.meta ? { meta: route.meta } : undefined;

    return {
      path,
      element,
      children,
      handle,
    };
  });
}

function normalizeReactRouteTree(
  routes: RouteRecord<React.ComponentType>[],
  parentPath = ''
): RouteRecord<React.ComponentType>[] {
  const normalizeBasePath = (path: string) =>
    path
      .replace(/\/\*$/, '')
      .replace(/\/+$/, '');

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

export async function createReactRouteAccess(
  options: ReactRouteAccessOptions
): Promise<ReactRouteAccessResult> {
  const { pageMap, routerComponents, ...coreOptions } = options;
  const normalizedPageMap = normalizeReactPageMap(pageMap);
  const result = await createRouteAccess({
    ...coreOptions,
    pageMap: normalizedPageMap,
  });

  const normalizedRoutes = normalizeReactRouteTree(result.routes);
  const routeObjects = toReactRouteObjects(
    normalizedRoutes,
    routerComponents?.Navigate,
    routerComponents?.Outlet
  );

  return { ...result, routeObjects };
}
