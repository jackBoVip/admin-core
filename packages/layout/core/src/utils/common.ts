/**
 * 通用工具函数
 * @description Vue 和 React 共用的工具函数
 */

import { debounce as sharedDebounce, throttle as sharedThrottle } from '@admin-core/preferences';
import {
  containsFunctionRecursively,
  deepCloneRich,
  getByPath,
} from '@admin-core/shared-core';
import { BREAKPOINTS } from '../constants';
import { TabManager } from './tabs';
import type { TabItem } from '../types';

/**
 * 类名参数类型
 */
type ClassValue = string | number | boolean | undefined | null | ClassValue[] | Record<string, boolean | undefined | null>;

/**
 * 合并类名工具函数
 * @param args 类名参数列表。
 * @returns 合并后的类名字符串。
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
 * `requestAnimationFrame` 节流（适用于滚动/resize 高频事件）。
 * @param fn 需要节流的函数。
 * @returns 节流后的函数（带 `cancel` 方法）。
 */
export function rafThrottle<T extends (...args: unknown[]) => void>(fn: T) {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: ThisParameterType<T> | null = null;
  const hasRaf = typeof requestAnimationFrame === 'function';
  const hasCancel = typeof cancelAnimationFrame === 'function';

  /**
   * 执行最新一次回调并重置节流状态。
   * @returns 无返回值。
   */
  const invoke = () => {
    rafId = null;
    if (!lastArgs) return;
    fn.apply(lastThis as ThisParameterType<T>, lastArgs);
    lastArgs = null;
    lastThis = null;
  };

  /**
   * 节流包装函数。
   * @description 仅在下一帧（或 16ms 回退定时器）触发一次 `fn`，并始终使用最后一次调用参数。
   * @param args 原始函数参数。
   * @returns 无返回值。
   */
  const throttled = function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    lastArgs = args;
    lastThis = this;
    if (rafId !== null) return;
    if (hasRaf) {
      rafId = requestAnimationFrame(invoke);
    } else {
      rafId = (setTimeout(invoke, 16) as unknown) as number;
    }
  } as T & {
    /** 取消节流队列的方法。 */
    cancel?: () => void;
  };

  throttled.cancel = () => {
    if (rafId === null) return;
    if (hasCancel) {
      cancelAnimationFrame(rafId);
    } else {
      clearTimeout(rafId as unknown as number);
    }
    rafId = null;
    lastArgs = null;
    lastThis = null;
  };

  return throttled;
}

/**
 * 响应式断点类型
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * 根据宽度获取断点。
 * @param width 屏幕宽度（必须为有效正数）。
 * @returns 断点名称。
 */
export function getBreakpoint(width: number): Breakpoint {
  /* 处理无效输入。 */
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
 * 判断是否为移动端。
 * @param width 屏幕宽度。
 * @returns 是否为移动端。
 */
export function isMobileWidth(width: number): boolean {
  return width < BREAKPOINTS.md;
}

/**
 * 判断是否为平板端。
 * @param width 屏幕宽度。
 * @returns 是否为平板端。
 */
export function isTabletWidth(width: number): boolean {
  return width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
}

/**
 * 判断是否为桌面端。
 * @param width 屏幕宽度。
 * @returns 是否为桌面端。
 */
export function isDesktopWidth(width: number): boolean {
  return width >= BREAKPOINTS.lg;
}

/**
 * 解包 currentPath（支持普通字符串和响应式对象）
 */
export interface CurrentPathRefLike {
  /** 当前路径值。 */
  value: string;
}

/**
 * 解包 currentPath（支持普通字符串和响应式对象）。
 * @param path 当前路径值或响应式包装对象。
 * @returns 纯字符串路径。
 */
export function unwrapCurrentPath(path: string | CurrentPathRefLike | undefined): string {
  if (!path) return '';
  if (typeof path === 'string') return path;
  return path.value;
}

/**
 * 全局 TabManager 实例缓存
 */
const tabManagerCache = new Map<string, TabManager>();
const TAB_MANAGER_CACHE_LIMIT = 50;

/**
 * `getOrCreateTabManager` 的参数类型。
 */
export interface GetOrCreateTabManagerOptions {
  /** 标签最大数量。 */
  maxCount?: number;
  /** 固定标签 key 列表。 */
  affixTabs?: string[];
  /** 持久化 key。 */
  persistKey?: string;
  /** 标签列表变更时触发。 */
  onChange?: (tabs: TabItem[]) => void;
}

/**
 * 获取或创建 `TabManager` 实例。
 * @description 确保同一 `persistKey` 只创建一个实例，并按最近使用顺序维护缓存。
 * @param options `TabManager` 配置项。
 * @returns `TabManager` 实例。
 */
export function getOrCreateTabManager(options: GetOrCreateTabManagerOptions): TabManager {
  const cacheKey = options.persistKey || '__default__';
  
  let manager = tabManagerCache.get(cacheKey);
  if (!manager) {
    if (tabManagerCache.size >= TAB_MANAGER_CACHE_LIMIT) {
      const oldestKey = tabManagerCache.keys().next().value;
      if (oldestKey) {
        tabManagerCache.delete(oldestKey);
      }
    }
    manager = new TabManager(options);
    tabManagerCache.set(cacheKey, manager);
  } else {
    /* 更新访问顺序，便于按最近使用淘汰。 */
    tabManagerCache.delete(cacheKey);
    tabManagerCache.set(cacheKey, manager);
    manager.setOnChange(options.onChange);
    /* 更新配置。 */
    manager.updateOptions({
      maxCount: options.maxCount,
      persistKey: options.persistKey,
    });
  }
  
  return manager;
}

/**
 * 清除 `TabManager` 缓存。
 * @param key 可选缓存键；不传时清空全部缓存。
 * @returns 无返回值。
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
  /** 键名。 */
  key: string;
  /** 显示标签。 */
  label: string;
  /** 图标标识。 */
  icon?: string;
  /** 是否禁用。 */
  disabled?: boolean;
  /** 是否分割线项。 */
  divider?: boolean;
}

/** 构建共享右键菜单项所需参数。 */
interface BuildSharedContextMenuItemsOptions {
  /** 是否允许收藏能力。 */
  canFavorite: boolean;
  /** 是否存在可关闭的左侧标签。 */
  hasLeft: boolean;
  /** 是否存在可关闭的其他标签。 */
  hasOther: boolean;
  /** 是否存在可关闭的右侧标签。 */
  hasRight: boolean;
  /** 目标标签是否激活。 */
  isActive: boolean;
  /** 目标标签是否固定。 */
  isAffix: boolean;
  /** 目标标签是否已收藏。 */
  isFavorite: boolean;
  /** 固定项 key 模式。 */
  pinKeyMode: 'fixed' | 'toggle';
  /** 国际化函数。 */
  t: (key: string) => string;
  /** 当前标签列表。 */
  tabs: TabItem[];
}

/**
 * 构建标签栏右键菜单公共项。
 * @param options 菜单状态与国际化配置。
 * @returns 菜单项数组。
 */
function buildSharedContextMenuItems(options: BuildSharedContextMenuItemsOptions): TabContextMenuItem[] {
  const {
    canFavorite,
    hasLeft,
    hasOther,
    hasRight,
    isActive,
    isAffix,
    isFavorite,
    pinKeyMode,
    t,
    tabs,
  } = options;

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
      key: isFavorite ? 'unfavorite' : 'favorite',
      label: isFavorite
        ? t('layout.tabbar.contextMenu.unfavorite')
        : t('layout.tabbar.contextMenu.favorite'),
      icon: 'star',
      disabled: !canFavorite,
    },
    {
      key: pinKeyMode === 'toggle' && isAffix ? 'unpin' : 'pin',
      label: isAffix
        ? t('layout.tabbar.contextMenu.unpin')
        : t('layout.tabbar.contextMenu.pin'),
      icon: 'pin',
    },
  ];
}

/**
 * 获取标签栏右键菜单项参数。
 */
export interface GetTabContextMenuItemsOptions {
  /** 目标标签 key。 */
  targetKey: string;
  /** 当前激活标签 key。 */
  activeKey: string;
  /** 全量标签列表。 */
  tabs: TabItem[];
  /** 国际化函数。 */
  t: (key: string) => string;
  /** 目标标签是否已收藏。 */
  isFavorite?: boolean;
  /** 是否允许收藏能力。 */
  canFavorite?: boolean;
}

/**
 * 获取标签栏右键菜单项。
 * @param options 菜单生成参数。
 * @returns 菜单项数组。
 */
export function getTabContextMenuItems(options: GetTabContextMenuItemsOptions): TabContextMenuItem[] {
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

  const isFavorite = options.isFavorite ?? false;
  const canFavorite = options.canFavorite !== false;

  return buildSharedContextMenuItems({
    canFavorite,
    hasLeft,
    hasOther,
    hasRight,
    isActive,
    isAffix,
    isFavorite,
    pinKeyMode: 'fixed',
    t,
    tabs,
  });
}

/**
 * 上下文菜单操作类型
 */
export type ContextMenuAction =
  | 'reload'
  | 'close'
  | 'closeLeft'
  | 'closeRight'
  | 'closeOther'
  | 'closeAll'
  | 'favorite'
  | 'unfavorite'
  | 'pin'
  | 'unpin'
  | 'openInNewWindow'
  | 'maximize'
  | 'restoreMaximize';

/**
 * 上下文菜单项
 */
export interface ContextMenuItem {
  /** 键名。 */
  key: ContextMenuAction | string;
  /** 显示标签。 */
  label: string;
  /** 图标标识。 */
  icon?: string;
  /** 是否禁用。 */
  disabled?: boolean;
  /** 是否分割线项。 */
  divider?: boolean;
}

/** 生成上下文菜单项时的附加选项。 */
export interface GenerateContextMenuItemsExtraOptions {
  /** 当前是否最大化状态。 */
  isMaximized?: boolean;
  /** 是否已收藏。 */
  isFavorite?: boolean;
  /** 是否允许收藏能力。 */
  canFavorite?: boolean;
}

/**
 * 生成上下文菜单项（支持更多选项，如最大化）。
 * @param tab 目标标签。
 * @param tabs 全量标签列表。
 * @param activeKey 当前激活标签 key。
 * @param t 国际化函数。
 * @param tabIndexMap 标签 key 到索引映射。
 * @param options 附加配置。
 * @returns 上下文菜单项列表。
 */
export function generateContextMenuItems(
  tab: TabItem,
  tabs: TabItem[],
  activeKey: string,
  t: (key: string) => string,
  tabIndexMap: Map<string, number>,
  options?: GenerateContextMenuItemsExtraOptions
): ContextMenuItem[] {
  const targetKey = tab.key;
  const currentIndex = tabIndexMap.get(targetKey) ?? -1;
  const isAffix = tab.affix === true;
  const isActive = targetKey === activeKey;
  const isMaximized = options?.isMaximized ?? false;
  const isFavorite = options?.isFavorite ?? false;
  const canFavorite = options?.canFavorite !== false;
  
  let hasLeft = false;
  let hasRight = false;
  let hasOther = false;
  
  if (currentIndex > 0) {
    for (let i = 0; i < currentIndex; i += 1) {
      const tabKey = tabs[i]?.key;
      if (tabKey && !tabs[i]?.affix) {
        hasLeft = true;
        break;
      }
    }
  }
  
  if (currentIndex >= 0 && currentIndex < tabs.length - 1) {
    for (let i = currentIndex + 1; i < tabs.length; i += 1) {
      if (!tabs[i]?.affix) {
        hasRight = true;
        break;
      }
    }
  }
  
  for (const t of tabs) {
    if (t.key !== targetKey && !t.affix) {
      hasOther = true;
      break;
    }
  }

  const items: ContextMenuItem[] = buildSharedContextMenuItems({
    canFavorite,
    hasLeft,
    hasOther,
    hasRight,
    isActive,
    isAffix,
    isFavorite,
    pinKeyMode: 'toggle',
    t,
    tabs,
  });

  /* 添加最大化选项。 */
  if (isMaximized) {
    items.push({
      key: 'divider-4',
      label: '',
      divider: true,
    });
    items.push({
      key: 'restoreMaximize',
      label: t('layout.tabbar.contextMenu.restoreMaximize'),
      icon: 'restore',
    });
  } else {
    items.push({
      key: 'divider-4',
      label: '',
      divider: true,
    });
    items.push({
      key: 'maximize',
      label: t('layout.tabbar.contextMenu.maximize'),
      icon: 'maximize',
    });
  }

  return items;
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
 * 防抖函数封装。
 * @param fn 目标函数。
 * @param delay 延迟毫秒数。
 * @returns 防抖后的函数。
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  return sharedDebounce(fn, delay);
}

/**
 * 节流函数封装。
 * @param fn 目标函数。
 * @param delay 延迟毫秒数。
 * @returns 节流后的函数。
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  return sharedThrottle(fn, delay);
}

/**
 * 深度克隆对象。
 * 优先使用 `structuredClone`（现代浏览器），失败时回退到手动实现。
 * @param obj 要克隆的对象。
 * @param seen 用于循环引用检测的 `WeakMap`（内部使用）。
 * @returns 克隆后的对象。
 */
export function deepClone<T>(obj: T, seen = new WeakMap<object, unknown>()): T {
  /* 基础类型直接返回。 */
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  /* 尝试使用 `structuredClone`（更快，支持循环引用）。 */
  /* 注意：`structuredClone` 不支持函数、DOM 节点、Symbol 等。 */
  if (typeof structuredClone === 'function' && !containsFunctionRecursively(obj)) {
    try {
      return structuredClone(obj);
    } catch {
      /* 如果 `structuredClone` 失败，回退到手动实现。 */
    }
  }
  
  return deepCloneRich(obj, seen, {
    cloneError: true,
  });
}

/**
 * 安全获取嵌套对象属性。
 * @param obj 目标对象。
 * @param path 属性路径（如 `'a.b.c'`）。
 * @param defaultValue 默认值。
 * @returns 读取到的属性值；缺失时返回默认值。
 */
export function get<T = unknown>(
  obj: Record<string, unknown> | undefined | null,
  path: string,
  defaultValue?: T
): T {
  return getByPath(obj, path, defaultValue, {
    emptyPath: 'default',
    skipEmptyKeys: false,
  });
}

/* ID 生成计数器，确保唯一性。 */
let idCounter = 0;

/**
 * 生成唯一 ID。
 * 使用时间戳 + 计数器 + 随机字符串，确保高并发下不重复。
 * @param prefix 前缀。
 * @returns 唯一 ID。
 */
export function generateId(prefix = 'id'): string {
  idCounter = (idCounter + 1) % Number.MAX_SAFE_INTEGER;
  return `${prefix}-${Date.now()}-${idCounter}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 检查是否为 SSR 环境。
 * @returns 是否为 SSR 环境。
 */
export function isSSR(): boolean {
  return typeof window === 'undefined';
}

/**
 * 窗口尺寸对象。
 */
export interface WindowSize {
  /** 窗口宽度。 */
  width: number;
  /** 窗口高度。 */
  height: number;
}

/**
 * 获取窗口尺寸（SSR 安全）。
 * @returns 窗口宽高；SSR 环境返回兜底值。
 */
export function getWindowSize(): WindowSize {
  if (isSSR()) {
    return { width: 1024, height: 768 };
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}
