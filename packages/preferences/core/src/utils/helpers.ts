/**
 * 共享工具函数
 * @description 通用工具函数和布局判断逻辑
 */

import type { LayoutType } from '../types';

// ========== 类型判断工具 ==========

/**
 * 判断是否为普通对象
 */
export function isObject(item: unknown): item is Record<string, unknown> {
  return item !== null && typeof item === 'object' && !Array.isArray(item);
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
  // 处理空字符串路径
  if (!path || path.trim() === '') {
    return (obj === undefined ? defaultValue : obj) as T;
  }

  const keys = path.split('.');
  let result: unknown = obj;

  for (const key of keys) {
    // 跳过空键（如 'a..b' 中的空串）
    if (!key) continue;
    
    if (result === null || result === undefined) {
      return defaultValue as T;
    }
    result = (result as Record<string, unknown>)[key];
  }

  return (result === undefined ? defaultValue : result) as T;
}

// ========== 布局类型常量 ==========

/**
 * 布局类型分类
 * @description 将布局类型按特征进行分组，便于判断和维护
 */
export const LAYOUT_CATEGORIES = {
  /** 顶部菜单布局 - 菜单显示在顶栏 */
  headerMenu: ['header-nav', 'mixed-nav', 'header-mixed-nav'] as const,
  /** 侧边菜单布局 - 菜单显示在侧边栏 */
  sidebarMenu: ['sidebar-nav', 'sidebar-mixed-nav', 'header-sidebar-nav'] as const,
  /** 混合导航布局 - 同时使用顶栏和侧边栏菜单 */
  mixed: ['mixed-nav', 'header-mixed-nav', 'sidebar-mixed-nav'] as const,
  /** 纯内容布局 - 无导航菜单 */
  fullContent: ['full-content'] as const,
  /** 所有支持的布局类型 */
  all: [
    'sidebar-nav',
    'sidebar-mixed-nav',
    'header-nav',
    'header-sidebar-nav',
    'mixed-nav',
    'header-mixed-nav',
    'full-content',
  ] as const,
} as const;

// 使用 Set 优化查找性能
const headerMenuLayoutSet = new Set<LayoutType>(LAYOUT_CATEGORIES.headerMenu);
const sidebarMenuLayoutSet = new Set<LayoutType>(LAYOUT_CATEGORIES.sidebarMenu);
const mixedLayoutSet = new Set<LayoutType>(LAYOUT_CATEGORIES.mixed);

// ========== 布局判断工具函数 ==========

/**
 * 判断是否为顶部菜单布局
 * @description 顶部菜单布局包括：header-nav、mixed-nav、header-mixed-nav
 * @param layout - 布局类型
 * @returns 是否为顶部菜单布局
 */
export function isHeaderMenuLayout(layout: LayoutType): boolean {
  return headerMenuLayoutSet.has(layout);
}

/**
 * 判断是否为侧边菜单布局
 * @description 侧边菜单布局包括：sidebar-nav、sidebar-mixed-nav、header-sidebar-nav
 * @param layout - 布局类型
 * @returns 是否为侧边菜单布局
 */
export function isSidebarMenuLayout(layout: LayoutType): boolean {
  return sidebarMenuLayoutSet.has(layout);
}

/**
 * 判断是否为全屏内容布局
 * @param layout - 布局类型
 * @returns 是否为全屏内容布局
 */
export function isFullContentLayout(layout: LayoutType): boolean {
  return layout === 'full-content';
}

/**
 * 判断是否为混合导航布局
 * @description 混合导航布局包括：mixed-nav、header-mixed-nav、sidebar-mixed-nav
 * @param layout - 布局类型
 * @returns 是否为混合导航布局
 */
export function isMixedLayout(layout: LayoutType): boolean {
  return mixedLayoutSet.has(layout);
}

/**
 * 判断布局是否显示侧边栏
 * @param layout - 布局类型
 * @returns 是否显示侧边栏
 */
export function hasSidebar(layout: LayoutType): boolean {
  return layout !== 'header-nav' && layout !== 'full-content';
}

/**
 * 判断布局是否显示顶栏菜单
 * @param layout - 布局类型
 * @returns 是否显示顶栏菜单
 */
export function hasHeaderMenu(layout: LayoutType): boolean {
  return isHeaderMenuLayout(layout);
}

/**
 * 获取布局的主要导航位置
 * @param layout - 布局类型
 * @returns 'header' | 'sidebar' | 'both' | 'none'
 */
export function getNavigationPosition(layout: LayoutType): 'header' | 'sidebar' | 'both' | 'none' {
  if (layout === 'full-content') return 'none';
  if (isMixedLayout(layout)) return 'both';
  if (isHeaderMenuLayout(layout)) return 'header';
  return 'sidebar';
}
