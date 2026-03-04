/**
 * 菜单工具集合。
 * @description 提供菜单树遍历、路径匹配、面包屑生成与缓存管理等基础能力。
 */

import { LAYOUT_UI_TOKENS } from '../constants';
import { getPathWithoutQuery } from './tabs';
import type { AutoBreadcrumbConfig, BreadcrumbItem, MenuItem } from '../types';
import type { BreadcrumbPreferences } from '@admin-core/preferences';

/**
 * 菜单项类名计算参数。
 */
export interface GetMenuItemClassNameOptions {
  /** 菜单层级。 */
  level?: number;
  /** 当前菜单项是否激活。 */
  isActive?: boolean;
  /** 当前菜单项是否展开。 */
  isExpanded?: boolean;
  /** 当前菜单项是否包含激活子项。 */
  hasActiveChild?: boolean;
}

/**
 * 基于菜单生成面包屑时的附加参数。
 */
export interface GenerateBreadcrumbsFromMenusOptions {
  /** 显示首页。 */
  showHome?: boolean;
  /** 首页路径。 */
  homePath?: string;
  /** 首页名称。 */
  homeName?: string;
  /** 首页图标。 */
  homeIcon?: string;
  /** 只有一项时隐藏。 */
  hideOnlyOne?: boolean;
}

/**
 * 菜单路径索引结构。
 */
export interface MenuPathIndex {
  /** 路径到菜单项映射。 */
  byPath: Map<string, MenuItem>;
  /** 标识到菜单项映射。 */
  byKey: Map<string, MenuItem>;
  /** 列表数据。 */
  pathItems: MenuItem[];
  /** 标识到链路映射。 */
  chainByKey: Map<string, string[]>;
  /** 路径到链路映射。 */
  chainByPath: Map<string, string[]>;
  /** 路径解析缓存。 */
  resolvedByPath: Map<string, MenuItem | undefined>;
}

/**
 * 计算菜单项的 padding 值
 * @param level - 菜单层级（从 0 开始）
 * @returns padding 值（像素）
 */
export function calculateMenuItemPadding(level: number): number {
  return LAYOUT_UI_TOKENS.MENU_ITEM_BASE_PADDING + level * LAYOUT_UI_TOKENS.MENU_ITEM_LEVEL_INDENT;
}

/**
 * 判断菜单项是否激活
 * @param item - 菜单项
 * @param currentPath - 当前路径
 * @returns 是否激活
 */
export function isMenuItemActive(item: MenuItem, currentPath: string): boolean {
  if (!currentPath) return false;

  /* 精确匹配。 */
  if (item.path === currentPath) return true;

  /* 如果菜单项有子菜单，检查子菜单中是否有激活项。 */
  if (item.children && item.children.length > 0) {
    return item.children.some(child => isMenuItemActive(child, currentPath));
  }
  
  return false;
}

/**
 * 判断菜单项是否应该展开
 * @param item - 菜单项
 * @param currentPath - 当前路径
 * @param openedMenuSet - 已打开的菜单集合
 * @returns 是否应该展开
 */
export function shouldMenuItemExpand(
  item: MenuItem,
  currentPath: string,
  openedMenuSet: Set<string>
): boolean {
  /* 如果已在打开集合中，返回 true。 */
  if (openedMenuSet.has(item.key)) return true;

  /* 如果当前路径匹配，返回 true。 */
  if (isMenuItemActive(item, currentPath)) return true;

  return false;
}

/**
 * 判断菜单项是否有子菜单
 * @param item - 菜单项
 * @returns 是否有子菜单
 */
export function hasChildren(item: MenuItem): boolean {
  return !!(item.children && item.children.length > 0);
}

/**
 * 按 `key` 在菜单树中递归查找菜单项。
 * @param menus 菜单树数据。
 * @param key 目标菜单 `key`。
 * @returns 匹配到的菜单项；未命中时返回 `null`。
 */
export function findMenuByKey(menus: MenuItem[], key: string): MenuItem | null {
  for (const item of menus) {
    if (item.key === key) {
      return item;
    }
    if (item.children) {
      const found = findMenuByKey(item.children, key);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 判断菜单项是否激活（通过 key 或 path 匹配）
 * @param item - 菜单项
 * @param activeKey - 激活的 key 或 path
 * @returns 是否激活
 */
export function isMenuActive(item: MenuItem, activeKey: string): boolean {
  if (!activeKey) return false;
  return item.key === activeKey || item.path === activeKey;
}

/**
 * 判断菜单项是否有激活的子菜单
 * @param item - 菜单项
 * @param activeKey - 激活的 key
 * @returns 是否有激活的子菜单
 */
export function hasActiveChild(item: MenuItem, activeKey: string): boolean {
  if (!item.children || item.children.length === 0) return false;
  return item.children.some(child => {
    if (isMenuActive(child, activeKey)) return true;
    return hasActiveChild(child, activeKey);
  });
}

/**
 * 获取菜单项的类名
 * @param item - 菜单项
 * @param options - 选项
 * @returns 类名字符串
 */
export function getMenuItemClassName(
  item: MenuItem,
  options?: GetMenuItemClassNameOptions
): string {
  const classes: string[] = ['sidebar-menu__item'];
  
  if (options?.level !== undefined) {
    classes.push(`sidebar-menu__item--level-${options.level}`);
  }
  
  if (options?.isActive) {
    classes.push('sidebar-menu__item--active');
  }
  
  if (options?.isExpanded) {
    classes.push('sidebar-menu__item--expanded');
  }
  
  if (options?.hasActiveChild) {
    classes.push('sidebar-menu__item--has-active-child');
  }
  
  if (item.disabled) {
    classes.push('sidebar-menu__item--disabled');
  }
  
  if (hasChildren(item)) {
    classes.push('sidebar-menu__item--has-children');
  }
  
  return classes.join(' ');
}

/**
 * 查找第一个可激活的子菜单项
 * @param item - 菜单项
 * @returns 第一个可激活的子菜单项，如果没有则返回 null
 */
export function findFirstActivatableChild(item: MenuItem): MenuItem | null {
  if (!item.children || item.children.length === 0) return null;
  
  for (const child of item.children) {
    if (child.hidden || child.disabled) continue;
    if (child.path) return child;
    const found = findFirstActivatableChild(child);
    if (found) return found;
  }
  
  return null;
}

/**
 * 获取菜单项的所有父级 key
 * @param menus - 菜单列表
 * @param targetKey - 目标 key
 * @returns 父级 key 数组
 */
export function getMenuParentKeys(menus: MenuItem[], targetKey: string): string[] {
  const keys: string[] = [];

  /**
   * 深度遍历菜单树并记录目标节点的父级 key 链。
   * @param items 当前层菜单列表。
   * @param target 目标菜单 key。
   * @param parentKeys 已收集的父级 key 链。
   * @returns 是否已命中目标菜单。
   */
  function traverse(items: MenuItem[], target: string, parentKeys: string[]): boolean {
    for (const item of items) {
      const currentKeys = [...parentKeys, item.key];
      if (item.key === target) {
        /* 不包括自己。 */
        keys.push(...currentKeys.slice(0, -1));
        return true;
      }
      if (item.children && traverse(item.children, target, currentKeys)) {
          return true;
      }
    }
    return false;
  }
  
  traverse(menus, targetKey, []);
  return keys;
}

/* ============================================================ */
/* 菜单路径与索引工具 */
/* ============================================================ */

/**
 * 获取菜单项链路（从根节点到目标节点）。
 * @param menus 菜单树数据。
 * @param key 目标菜单 `key`。
 * @returns 包含目标节点在内的完整路径；未命中时返回空数组。
 */
export function getMenuPath(menus: MenuItem[], key: string): MenuItem[] {
  const path: MenuItem[] = [];
  const stack: MenuItem[] = [];

  /**
   * 深度遍历菜单树并构建目标节点路径。
   * @param items 当前层菜单列表。
   * @param target 目标菜单 key。
   * @returns 是否找到目标菜单。
   */
  function traverse(items: MenuItem[], target: string): boolean {
    for (const item of items) {
      stack.push(item);
      if (item.key === target) {
        path.push(...stack);
        stack.pop();
        return true;
      }
      if (item.children && traverse(item.children, target)) {
        stack.pop();
        return true;
      }
      stack.pop();
    }
    return false;
  }

  traverse(menus, key);
  return path;
}

/**
 * 将树形菜单拍平成一维数组。
 * @param menus 菜单树数据。
 * @returns 按深度优先顺序展开后的菜单列表。
 */
export function flattenMenus(menus: MenuItem[]): MenuItem[] {
  const result: MenuItem[] = [];
  const stack = [...menus].reverse();
  while (stack.length > 0) {
    const item = stack.pop();
    if (!item) continue;
    result.push(item);
    if (item.children?.length) {
      for (let i = item.children.length - 1; i >= 0; i -= 1) {
        stack.push(item.children[i]);
      }
    }
  }
  return result;
}

/**
 * 递归过滤 `hidden` 菜单项。
 * @param menus 原始菜单树。
 * @returns 移除隐藏节点后的新菜单树（不修改原对象）。
 */
export function filterHiddenMenus(menus: MenuItem[]): MenuItem[] {
  const result: MenuItem[] = [];
  for (const item of menus) {
    if (item.hidden) continue;
    const children = item.children ? filterHiddenMenus(item.children) : undefined;
    result.push({
      ...item,
      children,
    });
  }
  return result;
}

/**
 * 过滤隐藏菜单（带缓存）
 */
const EMPTY_MENU_LIST: MenuItem[] = [];
let menuCacheVersion = new WeakMap<MenuItem[], number>();

/**
 * 读取菜单缓存版本号。
 * @param menus 菜单列表引用。
 * @returns 对应菜单列表的缓存版本号。
 */
const getMenuCacheVersion = (menus: MenuItem[]) => menuCacheVersion.get(menus) ?? 0;

/**
 * 提升菜单缓存版本号。
 * @param menus 菜单列表引用。
 * @returns 无返回值。
 */
const bumpMenuCacheVersion = (menus: MenuItem[]) => {
  menuCacheVersion.set(menus, getMenuCacheVersion(menus) + 1);
};

/**
 * 隐藏菜单过滤缓存条目。
 */
interface HiddenMenusCacheEntry {
  /** 过滤后的菜单列表。 */
  value: MenuItem[];
  /** 缓存版本号。 */
  version: number;
}

let hiddenMenusCache = new WeakMap<MenuItem[], HiddenMenusCacheEntry>();

/**
 * 获取带缓存的隐藏菜单过滤结果。
 * @param menus 原始菜单列表。
 * @returns 过滤后的菜单列表。
 */
export function getCachedFilteredMenus(menus: MenuItem[]): MenuItem[] {
  if (!menus.length) return EMPTY_MENU_LIST;
  const version = getMenuCacheVersion(menus);
  const cached = hiddenMenusCache.get(menus);
  if (cached && cached.version === version) return cached.value;
  const filtered = filterHiddenMenus(menus);
  hiddenMenusCache.set(menus, { value: filtered, version });
  return filtered;
}

/**
 * 根据当前路径从菜单树生成面包屑列表。
 * @param menus 菜单树数据。
 * @param path 当前路由路径。
 * @param options 面包屑生成附加配置。
 * @returns 面包屑项列表。
 */
export function generateBreadcrumbsFromMenus(
  menus: MenuItem[],
  path: string,
  options?: GenerateBreadcrumbsFromMenusOptions
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [];
  const menuPath = getMenuPathByPath(menus, path);

  /* 添加首页（使用独特 key 前缀避免与菜单项冲突）。 */
  if (options?.showHome) {
    breadcrumbs.push({
      key: '__breadcrumb_home__',
      name: options.homeName || 'layout.breadcrumb.home',
      icon: options.homeIcon || 'home',
      path: options.homePath || '/',
      clickable: true,
    });
  }

  /* 从菜单路径生成面包屑（跳过与首页路径相同项，避免重复）。 */
  const homePath = options?.homePath || '/';
  for (const menu of menuPath) {
    if (options?.showHome && menu.path === homePath) {
      continue;
    }
    breadcrumbs.push({
      key: `__breadcrumb_${menu.key}__`,
      name: menu.name,
      icon: menu.icon,
      path: menu.path,
      clickable: !!menu.path && menu.path !== path,
    });
  }

  if (options?.hideOnlyOne && breadcrumbs.length <= 1) {
    return [];
  }

  return breadcrumbs;
}

/** 自动面包屑配置解析结果。 */
export interface ResolvedBreadcrumbOptions {
  /** 是否显示首页面包屑。 */
  showHome: boolean;
  /** 首页路径。 */
  homePath: string;
  /** 首页名称。 */
  homeName: string;
  /** 首页图标。 */
  homeIcon: string;
  /** 只有一项时是否隐藏。 */
  hideOnlyOne: boolean;
}

/** 自动面包屑配置解析参数。 */
export interface ResolveAutoBreadcrumbOptionsInput {
  /** 自动面包屑配置。 */
  autoBreadcrumb?: AutoBreadcrumbConfig;
  /** 面包屑偏好配置。 */
  breadcrumb?: Partial<BreadcrumbPreferences>;
  /** 默认首页路径。 */
  defaultHomePath?: string;
  /** 本地化首页名称。 */
  translatedHomeName?: string;
}

/**
 * 解析自动面包屑配置。
 * @param options 配置解析参数。
 * @returns 标准化后的自动面包屑配置。
 */
export function resolveAutoBreadcrumbOptions(
  options: ResolveAutoBreadcrumbOptionsInput
): ResolvedBreadcrumbOptions {
  const autoConfig = options.autoBreadcrumb || {};
  const breadcrumbConfig = options.breadcrumb || {};
  return {
    showHome: autoConfig.showHome ?? breadcrumbConfig.showHome ?? true,
    homePath: autoConfig.homePath || options.defaultHomePath || '/',
    homeName: autoConfig.homeName || options.translatedHomeName || 'layout.breadcrumb.home',
    homeIcon: autoConfig.homeIcon || 'home',
    hideOnlyOne: breadcrumbConfig.hideOnlyOne ?? true,
  };
}

/** 基于菜单索引生成面包屑参数。 */
export interface ResolveBreadcrumbsFromIndexOptions {
  /** 菜单索引。 */
  menuIndex: ReturnType<typeof buildMenuPathIndex>;
  /** 当前路径（去 query）。 */
  basePath: string;
  /** 是否显示首页面包屑。 */
  showHome?: boolean;
  /** 首页路径。 */
  homePath?: string;
  /** 首页名称。 */
  homeName?: string;
  /** 首页图标。 */
  homeIcon?: string;
  /** 只有一项时是否隐藏。 */
  hideOnlyOne?: boolean;
}

/**
 * 根据菜单索引生成面包屑。
 * @param options 生成参数。
 * @returns 面包屑列表。
 */
export function resolveBreadcrumbsFromIndex(
  options: ResolveBreadcrumbsFromIndexOptions
): BreadcrumbItem[] {
  const {
    menuIndex,
    basePath,
    showHome = true,
    homePath = '/',
    homeName = 'layout.breadcrumb.home',
    homeIcon = 'home',
    hideOnlyOne = true,
  } = options;

  if (!basePath || menuIndex.byKey.size === 0) {
    return [];
  }

  const menu = resolveMenuByPathIndex(menuIndex, basePath);
  const chainKeys =
    (menu?.key ? menuIndex.chainByKey.get(menu.key) : undefined) ??
    (menu?.path ? menuIndex.chainByPath.get(menu.path) : undefined) ??
    [];

  const items: BreadcrumbItem[] = [];
  if (showHome) {
    items.push({
      key: '__breadcrumb_home__',
      name: homeName,
      icon: homeIcon,
      path: homePath,
      clickable: true,
    });
  }

  for (const key of chainKeys) {
    const menuItem = menuIndex.byKey.get(key) ?? menuIndex.byPath.get(key);
    if (!menuItem) continue;
    if (showHome && menuItem.path === homePath) continue;
    const menuId = getMenuId(menuItem);
    items.push({
      key: `__breadcrumb_${menuId}__`,
      name: menuItem.name,
      icon: menuItem.icon,
      path: menuItem.path,
      clickable: !!menuItem.path && menuItem.path !== basePath,
    });
  }

  if (hideOnlyOne && items.length <= 1) {
    return [];
  }
  return items;
}

/**
 * 获取菜单路径索引（从根到目标的所有父级索引数组）。
 * @param menus 菜单列表。
 * @param key 目标菜单 key。
 * @returns 索引路径数组。
 */
export function getMenuPathIndex(menus: MenuItem[], key: string): number[] {
  const path: number[] = [];
  /**
   * 菜单遍历栈节点结构。
   */
  type MenuStackItem = {
    /** 当前菜单项。 */
    item: MenuItem;
    /** 当前层索引。 */
    index: number;
  };
  const stack: MenuStackItem[] = [];

  /**
   * 深度遍历菜单并收集目标节点索引路径。
   * @param items 当前层菜单列表。
   * @param target 目标菜单 key。
   * @returns 是否找到目标菜单。
   */
  function traverse(items: MenuItem[], target: string): boolean {
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      stack.push({ item, index: i });
      if (item.key === target) {
        path.push(...stack.map((s) => s.index));
        stack.pop();
        return true;
      }
      if (item.children && traverse(item.children, target)) {
        stack.pop();
        return true;
      }
      stack.pop();
    }
    return false;
  }

  traverse(menus, key);
  return path;
}

/**
 * 获取菜单项的唯一 ID。
 * @param menu 菜单项。
 * @returns 菜单 ID（优先使用 `key`，其次 `path`，最后 `name`）。
 */
export function getMenuId(menu: MenuItem | null | undefined): string {
  if (!menu) return '';
  const id = menu.key ?? menu.path ?? menu.name ?? '';
  return id === '' ? '' : String(id);
}

/**
 * 构建菜单路径索引，便于后续按 `key/path` 快速解析。
 * @param menus 菜单树数据。
 * @returns 菜单索引对象，包含 path/key 映射、链路映射和路径缓存。
 */
export function buildMenuPathIndex(menus: MenuItem[]): MenuPathIndex {
  const byPath = new Map<string, MenuItem>();
  const byKey = new Map<string, MenuItem>();
  const pathItems: MenuItem[] = [];
  const chainByKey = new Map<string, string[]>();
  const chainByPath = new Map<string, string[]>();
  const resolvedByPath = new Map<string, MenuItem | undefined>();

  /**
   * 深度遍历菜单并建立 path/key/链路索引。
   * @param items 当前层菜单列表。
   * @param parentChain 父级链路。
   * @returns 无返回值。
   */
  function traverse(items: MenuItem[], parentChain: string[]) {
    for (const item of items) {
      const id = getMenuId(item);
      const chain = id ? [...parentChain, id] : parentChain.slice();
      if (item.key) {
        byKey.set(item.key, item);
        if (chain.length > 0) {
          chainByKey.set(item.key, chain);
        }
      }
      if (item.path) {
        byPath.set(item.path, item);
        pathItems.push(item);
        if (chain.length > 0) {
          chainByPath.set(item.path, chain);
        }
      }
      if (item.children) {
        traverse(item.children, chain);
      }
    }
  }

  traverse(menus, []);

  /* 按路径长度倒序，确保前缀匹配优先命中更具体菜单。 */
  pathItems.sort((a, b) => (b.path?.length ?? 0) - (a.path?.length ?? 0));

  return { byPath, byKey, pathItems, chainByKey, chainByPath, resolvedByPath };
}

/**
 * 菜单索引缓存条目。
 * @description 按菜单数组引用缓存索引结果，避免重复构建。
 */
interface MenuIndexCacheEntry {
  /** 缓存版本号。 */
  version: number;
  /** 菜单索引。 */
  index: MenuPathIndex;
}

let menuIndexCache = new WeakMap<MenuItem[], MenuIndexCacheEntry>();

/**
 * 顶部菜单缓存条目。
 */
interface HeaderMenuCacheEntry {
  /** 缓存版本号。 */
  version: number;
  /** 不同模式下的菜单缓存。 */
  menuMap: Map<string, MenuItem[]>;
}

/**
 * 获取带缓存的菜单索引。
 * @param menus 菜单列表引用。
 * @returns 菜单索引。
 */
export function getCachedMenuPathIndex(menus: MenuItem[]): MenuPathIndex {
  const version = getMenuCacheVersion(menus);
  const cached = menuIndexCache.get(menus);
  if (cached && cached.version === version) return cached.index;
  const index = buildMenuPathIndex(menus);
  menuIndexCache.set(menus, { version, index });
  return index;
}

/**
 * 根据路径查找菜单项，支持精确匹配与前缀匹配。
 * @param menus 菜单树数据。
 * @param path 目标路径或菜单 `key`。
 * @returns 优先返回精确命中项；否则返回最长前缀匹配项。
 */
export function findMenuByPath(menus: MenuItem[], path: string): MenuItem | undefined {
  let exactMatch: MenuItem | undefined;
  let bestMatch: MenuItem | undefined;
  let bestMatchLength = 0;

  /**
   * 深度遍历菜单并按精确/前缀规则匹配路径。
   * @param items 当前层菜单列表。
   * @returns 是否已命中精确路径。
   */
  function traverse(items: MenuItem[]): boolean {
    for (const item of items) {
      const rawKey = item.key ?? '';
      const key = rawKey === '' ? '' : String(rawKey);
      const rawPath = item.path ?? '';
      const itemPath = rawPath === '' ? '' : String(rawPath);
      if (key === path || itemPath === path) {
        exactMatch = item;
        return true;
      }
      if (itemPath && path.startsWith(itemPath) && itemPath.length > bestMatchLength) {
        bestMatch = item;
        bestMatchLength = itemPath.length;
      }
      if (item.children?.length) {
        if (traverse(item.children)) {
          return true;
        }
      }
    }
    return false;
  }

  traverse(menus);
  return exactMatch ?? bestMatch;
}

/**
 * 根据路径解析菜单链路（从根节点到目标节点）。
 * @description 支持 `path` 的前缀匹配，优先返回精确命中链路。
 * @param menus 菜单树数据。
 * @param targetPath 目标路径或菜单 `key`。
 * @returns 命中路径链路；未命中时返回空数组。
 */
export function getMenuPathByPath(menus: MenuItem[], targetPath: string): MenuItem[] {
  let exactPath: MenuItem[] | null = null;
  let bestMatch: MenuItem[] = [];
  let bestLength = 0;
  const stack: MenuItem[] = [];

  /**
   * 深度遍历菜单并解析目标路径的父级链路。
   * @param items 当前层菜单列表。
   * @returns 是否已精确命中目标路径。
   */
  function traverse(items: MenuItem[]): boolean {
    for (const item of items) {
      stack.push(item);

      const rawKey = item.key ?? '';
      const key = rawKey === '' ? '' : String(rawKey);
      const rawPath = item.path ?? '';
      const itemPath = rawPath === '' ? '' : String(rawPath);

      if (itemPath === targetPath || key === targetPath) {
        exactPath = stack.slice();
        stack.pop();
        return true;
      }

      if (itemPath && targetPath.startsWith(itemPath) && itemPath.length > bestLength) {
        bestLength = itemPath.length;
        bestMatch = stack.slice();
      }

      if (item.children && traverse(item.children)) {
        stack.pop();
        return true;
      }

      stack.pop();
    }
    return false;
  }

  traverse(menus);
  if (exactPath) return exactPath;
  if (bestLength <= 1) return [];
  return bestMatch;
}

const RESOLVED_PATH_CACHE_LIMIT = 500;

/**
 * 控制路径解析缓存大小。
 * @param index 菜单索引对象。
 */
const trimResolvedPathCache = (index: ReturnType<typeof buildMenuPathIndex>) => {
  const cache = index.resolvedByPath;
  if (!cache) return;
  if (cache.size > RESOLVED_PATH_CACHE_LIMIT) {
    cache.clear();
  }
};

/**
 * 基于菜单索引解析菜单项。
 * @description 先走精确匹配，再回退到最长前缀匹配，并写入路径缓存。
 * @param index 菜单索引对象。
 * @param path 目标路径。
 * @returns 匹配到的菜单项；未命中时返回 `undefined`。
 */
export function resolveMenuByPathIndex(
  index: ReturnType<typeof buildMenuPathIndex>,
  path: string
): MenuItem | undefined {
  if (!path) return undefined;

  if (index.resolvedByPath && index.resolvedByPath.has(path)) {
    return index.resolvedByPath.get(path);
  }

  const menu = index.byPath.get(path) ?? index.byKey.get(path);
  if (menu) {
    index.resolvedByPath?.set(path, menu);
    trimResolvedPathCache(index);
    return menu;
  }

  for (const item of index.pathItems) {
    if (item.path && path.startsWith(item.path)) {
      index.resolvedByPath?.set(path, item);
      trimResolvedPathCache(index);
      return item;
    }
  }

  index.resolvedByPath?.set(path, undefined);
  trimResolvedPathCache(index);
  return undefined;
}

/** 顶部菜单解析选项。 */
export interface HeaderMenuOptions {
  /** 是否为顶部导航布局。 */
  isHeaderNav?: boolean;
  /** 是否为混合导航布局。 */
  isMixedNav?: boolean;
  /** 是否为顶部混合导航布局。 */
  isHeaderMixedNav?: boolean;
  /** 是否为头部+侧边栏组合布局。 */
  isHeaderSidebarNav?: boolean;
}

/**
 * 根据布局模式解析顶部导航菜单。
 * @param menus 原始菜单树。
 * @param options 顶部菜单解析选项。
 * @returns 顶部菜单列表；不适用顶部导航时返回空数组。
 */
export function resolveHeaderMenus(
  menus: MenuItem[] | undefined,
  options: HeaderMenuOptions = {}
): MenuItem[] {
  const list = menus ?? [];
  if (!list.length || options.isHeaderSidebarNav) return [];
  if (options.isHeaderNav) return list;
  if (options.isMixedNav || options.isHeaderMixedNav) {
    return list.map((item) => ({
      ...item,
      children: undefined,
    }));
  }
  return [];
}

/**
 * 顶部菜单缓存。
 * @description 按菜单引用与布局模式组合缓存顶部菜单结果。
 */
let headerMenuCache = new WeakMap<MenuItem[], HeaderMenuCacheEntry>();

/**
 * 获取带缓存的顶部菜单列表。
 * @param menus 菜单列表。
 * @param options 顶部菜单解析选项。
 * @returns 顶部菜单列表。
 */
export function getCachedHeaderMenus(
  menus: MenuItem[] | undefined,
  options: HeaderMenuOptions = {}
): MenuItem[] {
  const list = menus ?? [];
  if (!list.length) return EMPTY_MENU_LIST;
  const version = getMenuCacheVersion(list);
  const key = `${options.isHeaderNav ? 1 : 0}${options.isMixedNav ? 1 : 0}${options.isHeaderMixedNav ? 1 : 0}${options.isHeaderSidebarNav ? 1 : 0}`;
  const cacheEntry = headerMenuCache.get(list);
  let menuMap = cacheEntry?.menuMap;
  if (!menuMap || cacheEntry?.version !== version) {
    menuMap = new Map<string, MenuItem[]>();
    headerMenuCache.set(list, { version, menuMap });
  }
  const cached = menuMap.get(key);
  if (cached) return cached;
  const resolved = resolveHeaderMenus(list, options);
  menuMap.set(key, resolved);
  return resolved;
}

/**
 * 清理菜单缓存。
 * @description 当调用方原地修改菜单数组时，应调用此方法刷新缓存版本。
 * @param menus 需要清理缓存的菜单引用；不传时清空全部菜单缓存。
 * @returns 无返回值。
 */
export function clearMenuCaches(menus?: MenuItem[]): void {
  if (menus) {
    bumpMenuCacheVersion(menus);
    hiddenMenusCache.delete(menus);
    headerMenuCache.delete(menus);
    menuIndexCache.delete(menus);
    return;
  }
  hiddenMenusCache = new WeakMap<MenuItem[], HiddenMenusCacheEntry>();
  headerMenuCache = new WeakMap<MenuItem[], HeaderMenuCacheEntry>();
  menuIndexCache = new WeakMap<MenuItem[], MenuIndexCacheEntry>();
  menuCacheVersion = new WeakMap<MenuItem[], number>();
}

/** 顶部菜单激活 key 解析参数。 */
export interface HeaderActiveKeyOptions extends HeaderMenuOptions {
  /** 外部指定激活菜单 key。 */
  activeMenuKey?: string;
  /** 当前路径。 */
  currentPath?: string;
  /** 菜单索引。 */
  menuIndex: ReturnType<typeof buildMenuPathIndex>;
  /** 混合导航根菜单 key。 */
  mixedNavRootKey?: string | null;
}

/**
 * 解析顶部菜单激活项 `key`。
 * @param options 顶部菜单激活解析参数。
 * @returns 当前应激活的顶部菜单 `key`；无命中时返回空字符串。
 */
export function resolveHeaderActiveKey(options: HeaderActiveKeyOptions): string {
  if (options.isHeaderSidebarNav) return '';
  if (options.activeMenuKey) return String(options.activeMenuKey);
  if ((options.isMixedNav || options.isHeaderMixedNav) && options.mixedNavRootKey) {
    return String(options.mixedNavRootKey);
  }

  const basePath = getPathWithoutQuery(options.currentPath || '');
  if (!basePath) return '';

  const menu = resolveMenuByPathIndex(options.menuIndex, basePath);
  if (!menu) return '';

  const chain =
    (menu.key ? options.menuIndex.chainByKey.get(menu.key) : undefined) ??
    (menu.path ? options.menuIndex.chainByPath.get(menu.path) : undefined) ??
    [];

  if (options.isMixedNav || options.isHeaderMixedNav) {
    return chain[0] ? String(chain[0]) : '';
  }

  return menu.key ? String(menu.key) : '';
}
