/**
 * Page 类型守卫工具集合。
 * @description 提供页面项运行时判别函数，辅助区分路由页与组件页分支逻辑。
 */

import { isFunction as sharedIsFunction } from '@admin-core/shared-core';

import type { AdminPageItem, ComponentPageItem, RoutePageItem } from '../types';

/**
 * 判断值是否为函数。
 * @param value 待判断值。
 * @returns 是函数时返回 `true`。
 */
export const isFunction = sharedIsFunction;

/**
 * 判断页面项是否为路由页。
 * @param page 页面项。
 * @returns 是否路由页。
 */
export function isPageRouteItem<TComponent = unknown>(
  page: AdminPageItem<TComponent>
): page is RoutePageItem<TComponent> {
  return page.type === 'route';
}

/**
 * 判断页面项是否为组件页。
 * @param page 页面项。
 * @returns 是否组件页。
 */
export function isPageComponentItem<TComponent = unknown>(
  page: AdminPageItem<TComponent>
): page is ComponentPageItem<TComponent> {
  return page.type === 'component';
}
