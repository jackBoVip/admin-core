export { isFunction } from '@admin-core/shared-core';

import type { AdminPageItem, ComponentPageItem, RoutePageItem } from '../types';

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
