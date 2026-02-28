/**
 * 共享工具函数
 * @description 通用工具函数和布局判断逻辑
 */

import {
  getByPath,
  isNonArrayObject,
  LAYOUT_CATEGORIES as SHARED_LAYOUT_CATEGORIES,
} from '@admin-core/shared-core';

// ========== 类型判断工具 ==========

/**
 * 判断是否为普通对象
 */
export function isObject(item: unknown): item is Record<string, unknown> {
  return isNonArrayObject(item);
}

/**
 * 判断两个值是否相等（深度比较）
 * @description 支持处理 NaN、+0/-0、Infinity 等特殊值
 */
export function isEqual(a: unknown, b: unknown): boolean {
  // 严格相等
  if (a === b) {
    // 处理 +0 和 -0 的情况（它们严格相等但实际不同）
    // 1/+0 = Infinity, 1/-0 = -Infinity
    return a !== 0 || 1 / (a as number) === 1 / (b as number);
  }

  // 处理 NaN（NaN !== NaN，但 NaN 应该等于 NaN）
  if (typeof a === 'number' && typeof b === 'number') {
    return Number.isNaN(a) && Number.isNaN(b);
  }

  if (typeof a !== typeof b) return false;

  // null 检查（typeof null === 'object'）
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
 * 判断是否为空对象
 */
export function isEmpty(obj: unknown): boolean {
  if (obj === null || obj === undefined) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (isObject(obj)) return Object.keys(obj).length === 0;
  return false;
}

/**
 * 安全获取嵌套对象属性
 * @param obj - 源对象
 * @param path - 属性路径（如 'a.b.c'）
 * @param defaultValue - 默认值
 * @returns 属性值或默认值
 */
export function get<T = unknown>(obj: unknown, path: string, defaultValue?: T): T {
  return getByPath(obj, path, defaultValue, {
    emptyPath: 'value',
    skipEmptyKeys: true,
  });
}

// ========== 布局类型常量 ==========

/**
 * 布局类型分类
 * @description 将布局类型按特征进行分组，便于判断和维护
 */
export const LAYOUT_CATEGORIES = SHARED_LAYOUT_CATEGORIES;

export {
  getNavigationPosition,
  hasHeaderMenu,
  hasSidebar,
  isFullContentLayout,
  isHeaderMenuLayout,
  isMixedLayout,
  isSidebarMenuLayout,
} from '@admin-core/shared-core';

// ========== 布局判断工具函数 ==========
