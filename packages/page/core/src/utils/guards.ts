import type { AdminPageItem, ComponentPageItem, RoutePageItem } from '../types';

export function isFunction<T extends (...args: any[]) => any>(
  value: unknown
): value is T {
  return typeof value === 'function';
}

export function isPageRouteItem<TComponent = unknown>(
  page: AdminPageItem<TComponent>
): page is RoutePageItem<TComponent> {
  return page.type === 'route';
}

export function isPageComponentItem<TComponent = unknown>(
  page: AdminPageItem<TComponent>
): page is ComponentPageItem<TComponent> {
  return page.type === 'component';
}
