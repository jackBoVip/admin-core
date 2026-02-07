/**
 * 通用工具函数
 * @description Vue 和 React 共用的工具函数
 */

import { debounce as sharedDebounce, throttle as sharedThrottle } from '@admin-core/preferences';
import { BREAKPOINTS } from '../constants';
import { TabManager } from './layout';
import type { TabItem } from '../types';

/**
 * 类名参数类型
 */
type ClassValue = string | number | boolean | undefined | null | ClassValue[] | Record<string, boolean | undefined | null>;

/**
 * 合并类名工具函数
 * @example
 * classNames('foo', 'bar') // 'foo bar'
 * classNames('foo', { bar: true, baz: false }) // 'foo bar'
 * classNames(['foo', 'bar']) // 'foo bar'
 */
export function classNames(...args: ClassValue[]): string {
  const classes: string[] = [];

  for (const arg of args) {
    if (!arg) continue;

    if (typeof arg === 'string' || typeof arg === 'number') {
      classes.push(String(arg));
    } else if (Array.isArray(arg)) {
      const inner = classNames(...arg);
      if (inner) classes.push(inner);
    } else if (typeof arg === 'object') {
      for (const [key, value] of Object.entries(arg)) {
        if (value) classes.push(key);
      }
    }
  }

  return classes.join(' ');
}

/**
 * 响应式断点类型
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * 根据宽度获取断点
 * @param width - 屏幕宽度（必须为有效正数）
 */
export function getBreakpoint(width: number): Breakpoint {
  // 处理无效输入
  if (!Number.isFinite(width) || width < 0) {
    return 'xs';
  }
  if (width < BREAKPOINTS.sm) return 'xs';
  if (width < BREAKPOINTS.md) return 'sm';
  if (width < BREAKPOINTS.lg) return 'md';
  if (width < BREAKPOINTS.xl) return 'lg';
  if (width < BREAKPOINTS['2xl']) return 'xl';
  return '2xl';
}

/**
 * 判断是否为移动端
 */
export function isMobileWidth(width: number): boolean {
  return width < BREAKPOINTS.md;
}

/**
 * 判断是否为平板
 */
export function isTabletWidth(width: number): boolean {
  return width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
}

/**
 * 判断是否为桌面端
 */
export function isDesktopWidth(width: number): boolean {
  return width >= BREAKPOINTS.lg;
}

/**
 * 解包 currentPath（支持普通字符串和响应式对象）
 */
export function unwrapCurrentPath(path: string | { value: string } | undefined): string {
  if (!path) return '';
  if (typeof path === 'string') return path;
  return path.value;
}

/**
 * 全局 TabManager 实例缓存
 */
const tabManagerCache = new Map<string, TabManager>();

/**
 * 获取或创建 TabManager 实例
 * @description 确保同一 persistKey 只创建一个实例
 */
export function getOrCreateTabManager(options: {
  maxCount?: number;
  affixTabs?: string[];
  persistKey?: string;
  onChange?: (tabs: TabItem[]) => void;
}): TabManager {
  const cacheKey = options.persistKey || '__default__';
  
  let manager = tabManagerCache.get(cacheKey);
  if (!manager) {
    manager = new TabManager(options);
    tabManagerCache.set(cacheKey, manager);
  } else {
    // 更新配置
    manager.updateOptions({
      maxCount: options.maxCount,
      persistKey: options.persistKey,
    });
  }
  
  return manager;
}

/**
 * 清除 TabManager 缓存
 */
export function clearTabManagerCache(key?: string): void {
  if (key) {
    tabManagerCache.delete(key);
  } else {
    tabManagerCache.clear();
  }
}

/**
 * 标签栏右键菜单项类型
 */
export interface TabContextMenuItem {
  key: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  divider?: boolean;
}

/**
 * 获取标签栏右键菜单项
 */
export function getTabContextMenuItems(options: {
  targetKey: string;
  activeKey: string;
  tabs: TabItem[];
  t: (key: string) => string;
}): TabContextMenuItem[] {
  const { targetKey, activeKey, tabs, t } = options;
  let currentTab: TabItem | undefined;
  let currentIndex = -1;
  tabs.forEach((tab, index) => {
    if (tab.key === targetKey) {
      currentTab = tab;
      currentIndex = index;
    }
  });
  const isAffix = currentTab?.affix === true;
  const isActive = targetKey === activeKey;
  let hasLeft = false;
  let hasRight = false;
  let hasOther = false;
  if (currentIndex > 0) {
    for (let i = 0; i < currentIndex; i += 1) {
      if (!tabs[i].affix) {
        hasLeft = true;
        break;
      }
    }
  }
  if (currentIndex >= 0 && currentIndex < tabs.length - 1) {
    for (let i = currentIndex + 1; i < tabs.length; i += 1) {
      if (!tabs[i].affix) {
        hasRight = true;
        break;
      }
    }
  }
  for (const tab of tabs) {
    if (tab.key !== targetKey && !tab.affix) {
      hasOther = true;
      break;
    }
  }

  return [
    {
      key: 'reload',
      label: t('layout.tabbar.contextMenu.reload'),
      icon: 'refresh',
      disabled: !isActive,
    },
    {
      key: 'close',
      label: t('layout.tabbar.contextMenu.close'),
      icon: 'close',
      disabled: isAffix,
    },
    {
      key: 'divider-1',
      label: '',
      divider: true,
    },
    {
      key: 'closeLeft',
      label: t('layout.tabbar.contextMenu.closeLeft'),
      icon: 'chevron-left',
      disabled: !hasLeft,
    },
    {
      key: 'closeRight',
      label: t('layout.tabbar.contextMenu.closeRight'),
      icon: 'chevron-right',
      disabled: !hasRight,
    },
    {
      key: 'divider-2',
      label: '',
      divider: true,
    },
    {
      key: 'closeOther',
      label: t('layout.tabbar.contextMenu.closeOther'),
      icon: 'close',
      disabled: !hasOther,
    },
    {
      key: 'closeAll',
      label: t('layout.tabbar.contextMenu.closeAll'),
      icon: 'close',
      disabled: tabs.every(tab => tab.affix),
    },
    {
      key: 'divider-3',
      label: '',
      divider: true,
    },
    {
      key: 'pin',
      label: isAffix ? t('layout.tabbar.contextMenu.unpin') : t('layout.tabbar.contextMenu.pin'),
      icon: 'pin',
    },
  ];
}

/**
 * 组件类名前缀常量
 */
export const CLASS_PREFIX = {
  layout: 'layout',
  sidebar: 'layout-sidebar',
  header: 'layout-header',
  tabbar: 'layout-tabbar',
  content: 'layout-content',
  footer: 'layout-footer',
  panel: 'layout-panel',
  menu: 'sidebar-menu',
  headerMenu: 'header-menu',
} as const;

/**
 * 主题类名
 */
export const THEME_CLASSES = {
  light: 'theme-light',
  dark: 'theme-dark',
} as const;

/**
 * 防抖函数
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  return sharedDebounce(fn, delay);
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  return sharedThrottle(fn, delay);
}

/**
 * 检查对象是否包含函数（structuredClone 不支持函数）
 */
function containsFunction(obj: unknown, seen = new WeakSet()): boolean {
  if (obj === null || typeof obj !== 'object') {
    return typeof obj === 'function';
  }
  if (seen.has(obj)) return false;
  seen.add(obj);
  
  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (containsFunction(item, seen)) {
        return true;
      }
    }
    return false;
  }
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (containsFunction((obj as Record<string, unknown>)[key], seen)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * 深度克隆对象（内部实现）
 * 支持循环引用检测和特殊类型处理
 */
function deepCloneInternal<T>(obj: T, seen: WeakMap<object, unknown>): T {
  // 基础类型直接返回
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // 检测循环引用
  if (seen.has(obj as object)) {
    return seen.get(obj as object) as T;
  }
  
  // 处理特殊类型
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }
  
  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags) as T;
  }
  
  if (obj instanceof Error) {
    const clonedError = new (obj.constructor as new (message?: string) => Error)(obj.message);
    clonedError.name = obj.name;
    if (obj.stack) {
      clonedError.stack = obj.stack;
    }
    return clonedError as T;
  }
  
  if (obj instanceof Map) {
    const clonedMap = new Map();
    seen.set(obj as object, clonedMap);
    obj.forEach((value, key) => {
      clonedMap.set(deepCloneInternal(key, seen), deepCloneInternal(value, seen));
    });
    return clonedMap as T;
  }
  
  if (obj instanceof Set) {
    const clonedSet = new Set();
    seen.set(obj as object, clonedSet);
    obj.forEach((value) => {
      clonedSet.add(deepCloneInternal(value, seen));
    });
    return clonedSet as T;
  }
  
  // 处理数组
  if (Array.isArray(obj)) {
    const clonedArr: unknown[] = [];
    seen.set(obj as object, clonedArr);
    for (const item of obj) {
      clonedArr.push(deepCloneInternal(item, seen));
    }
    return clonedArr as T;
  }
  
  // 处理普通对象
  const cloned = {} as T;
  seen.set(obj as object, cloned);
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepCloneInternal(obj[key], seen);
    }
  }
  
  return cloned;
}

/**
 * 深度克隆对象
 * 优先使用 structuredClone（现代浏览器），回退到手动实现
 * @param obj - 要克隆的对象
 * @param seen - 用于循环引用检测的 WeakMap（内部使用）
 */
export function deepClone<T>(obj: T, seen = new WeakMap<object, unknown>()): T {
  // 基础类型直接返回
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // 尝试使用 structuredClone（更快，支持循环引用）
  // 注意：structuredClone 不支持函数、DOM 节点、Symbol 等
  if (typeof structuredClone === 'function' && !containsFunction(obj)) {
    try {
      return structuredClone(obj);
    } catch {
      // 如果 structuredClone 失败，回退到手动实现
    }
  }
  
  return deepCloneInternal(obj, seen);
}

/**
 * 安全获取嵌套对象属性
 * @param obj - 目标对象
 * @param path - 属性路径（如 'a.b.c'）
 * @param defaultValue - 默认值
 */
export function get<T = unknown>(
  obj: Record<string, unknown> | undefined | null,
  path: string,
  defaultValue?: T
): T {
  if (!obj) return defaultValue as T;
  
  // 处理空路径
  if (!path || path.trim() === '') {
    return defaultValue as T;
  }
  
  const keys = path.split('.');
  let result: unknown = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue as T;
    }
    result = (result as Record<string, unknown>)[key];
  }
  
  return (result === undefined ? defaultValue : result) as T;
}

// ID 生成计数器，确保唯一性
let idCounter = 0;

/**
 * 生成唯一 ID
 * 使用时间戳 + 计数器 + 随机字符串，确保高并发下不重复
 */
export function generateId(prefix = 'id'): string {
  idCounter = (idCounter + 1) % Number.MAX_SAFE_INTEGER;
  return `${prefix}-${Date.now()}-${idCounter}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 检查是否为 SSR 环境
 */
export function isSSR(): boolean {
  return typeof window === 'undefined';
}

/**
 * 获取窗口尺寸（SSR 安全）
 */
export function getWindowSize(): { width: number; height: number } {
  if (isSSR()) {
    return { width: 1024, height: 768 };
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}
