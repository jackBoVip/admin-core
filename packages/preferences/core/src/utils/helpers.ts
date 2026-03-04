/**
 * 通用工具函数集合。
 * @description 提供对象判断、深比较、取值及布局分类常量。
 */

import {
  getNavigationPosition as sharedGetNavigationPosition,
  getByPath,
  hasHeaderMenu as sharedHasHeaderMenu,
  hasSidebar as sharedHasSidebar,
  isFullContentLayout as sharedIsFullContentLayout,
  isHeaderMenuLayout as sharedIsHeaderMenuLayout,
  isMixedLayout as sharedIsMixedLayout,
  isNonArrayObject,
  isSidebarMenuLayout as sharedIsSidebarMenuLayout,
  LAYOUT_CATEGORIES as SHARED_LAYOUT_CATEGORIES,
} from '@admin-core/shared-core';

/* ========== 类型判断工具 ========== */

/**
 * 判断值是否为普通对象（非数组）。
 * @param item 待判断值。
 * @returns 普通对象返回 `true`，否则返回 `false`。
 */
export function isObject(item: unknown): item is Record<string, unknown> {
  return isNonArrayObject(item);
}

/**
 * 深度比较两个值是否语义相等。
 * @description 支持 `NaN`、`+0/-0`、数组与纯对象的递归比较。
 * @param a 待比较值 A。
 * @param b 待比较值 B。
 * @returns 语义相等返回 `true`，否则返回 `false`。
 */
export function isEqual(a: unknown, b: unknown): boolean {
  /* 严格相等。 */
  if (a === b) {
    /* 处理 +0 和 -0 的情况（它们严格相等但实际不同）。 */
    /* `1/+0 = Infinity`，`1/-0 = -Infinity`。 */
    return a !== 0 || 1 / (a as number) === 1 / (b as number);
  }

  /* 处理 NaN（`NaN !== NaN`，但语义上应视为相等）。 */
  if (typeof a === 'number' && typeof b === 'number') {
    return Number.isNaN(a) && Number.isNaN(b);
  }

  if (typeof a !== typeof b) return false;

  /* null 检查（`typeof null === 'object'`）。 */
  if (a === null || b === null) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => isEqual(item, b[index]));
  }

  if (isObject(a) && isObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    return keysA.every((key) => isEqual(a[key], b[key]));
  }

  return false;
}

/**
 * 判断值是否为空。
 * @param obj 待判断值。
 * @returns `null/undefined`、空数组、空对象时返回 `true`。
 */
export function isEmpty(obj: unknown): boolean {
  if (obj === null || obj === undefined) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (isObject(obj)) return Object.keys(obj).length === 0;
  return false;
}

/**
 * 安全读取嵌套对象路径值。
 * @template T 返回值类型。
 * @param obj 源对象。
 * @param path 点分隔路径（如 `a.b.c`）。
 * @param defaultValue 读取失败时的默认值。
 * @returns 路径值或默认值。
 */
export function get<T = unknown>(obj: unknown, path: string, defaultValue?: T): T {
  return getByPath(obj, path, defaultValue, {
    emptyPath: 'value',
    skipEmptyKeys: true,
  });
}

/* ========== 布局类型常量 ========== */

/**
 * 布局类型分类常量。
 * @description 将布局类型按导航结构分组，便于布局能力判断。
 */
export const LAYOUT_CATEGORIES = SHARED_LAYOUT_CATEGORIES;
/**
 * 获取布局对应的导航位置。
 * @param layout 布局类型。
 * @returns 导航位置标识。
 */
export const getNavigationPosition = sharedGetNavigationPosition;

/**
 * 判断布局是否包含顶部菜单。
 * @param layout 布局类型。
 * @returns 包含顶部菜单返回 `true`。
 */
export const hasHeaderMenu = sharedHasHeaderMenu;

/**
 * 判断布局是否包含侧边栏。
 * @param layout 布局类型。
 * @returns 包含侧边栏返回 `true`。
 */
export const hasSidebar = sharedHasSidebar;

/**
 * 判断是否为全内容布局。
 * @param layout 布局类型。
 * @returns 为全内容布局返回 `true`。
 */
export const isFullContentLayout = sharedIsFullContentLayout;

/**
 * 判断是否为顶部菜单布局。
 * @param layout 布局类型。
 * @returns 为顶部菜单布局返回 `true`。
 */
export const isHeaderMenuLayout = sharedIsHeaderMenuLayout;

/**
 * 判断是否为混合布局。
 * @param layout 布局类型。
 * @returns 为混合布局返回 `true`。
 */
export const isMixedLayout = sharedIsMixedLayout;

/**
 * 判断是否为侧边菜单布局。
 * @param layout 布局类型。
 * @returns 为侧边菜单布局返回 `true`。
 */
export const isSidebarMenuLayout = sharedIsSidebarMenuLayout;
