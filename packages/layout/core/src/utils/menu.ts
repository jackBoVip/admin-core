/**
 * 菜单工具函数
 * @description 用于处理菜单相关的逻辑
 */

import { LAYOUT_UI_TOKENS } from '../constants';
import { getPathWithoutQuery } from './tabs';
import type { AutoBreadcrumbConfig, BreadcrumbItem, MenuItem } from '../types';
import type { BreadcrumbPreferences } from '@admin-core/preferences';

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
  
  // 精确匹配
  if (item.path === currentPath) return true;
  
  // 如果菜单项有子菜单，检查子菜单中是否有激活项
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
  // 如果已经在打开的集合中，返回 true
  if (openedMenuSet.has(item.key)) return true;
  
  // 如果当前路径匹配，返回 true
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
 * 根据 key 查找菜单项
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
  options?: {
    level?: number;
    isActive?: boolean;
    isExpanded?: boolean;
    hasActiveChild?: boolean;
  }
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
  
  function traverse(items: MenuItem[], target: string, parentKeys: string[]): boolean {
    for (const item of items) {
      const currentKeys = [...parentKeys, item.key];
      if (item.key === target) {
        keys.push(...currentKeys.slice(0, -1)); // 不包括自己
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

// ============================================================
// 菜单路径与索引工具
// ============================================================

/**
 * 获取菜单路径（从根到目标的所有父级）
 */
export function getMenuPath(menus: MenuItem[], key: string): MenuItem[] {
  const path: MenuItem[] = [];
  const stack: MenuItem[] = [];

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
 * 扁平化菜单
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
 * 过滤隐藏菜单
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
let hiddenMenusCache = new WeakMap<MenuItem[], { value: MenuItem[]; length: number }>();

export function getCachedFilteredMenus(menus: MenuItem[]): MenuItem[] {
  if (!menus.length) return EMPTY_MENU_LIST;
  const cached = hiddenMenusCache.get(menus);
  if (cached && cached.length === menus.length) return cached.value;
  const filtered = filterHiddenMenus(menus);
  hiddenMenusCache.set(menus, { value: filtered, length: menus.length });
  return filtered;
}

/**
 * 根据路径从菜单中生成面包屑
 * @param menus 菜单数据
 * @param path 当前路径
 * @param options 配置选项
 */
export function generateBreadcrumbsFromMenus(
  menus: MenuItem[],
  path: string,
  options?: {
    /** 显示首页 */
    showHome?: boolean;
    /** 首页路径 */
    homePath?: string;
    /** 首页名称 */
    homeName?: string;
    /** 首页图标 */
    homeIcon?: string;
    /** 只有一项时隐藏 */
    hideOnlyOne?: boolean;
  }
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [];
  const menuPath = getMenuPathByPath(menus, path);

  // 添加首页（使用独特的 key 前缀避免与菜单项冲突）
  if (options?.showHome) {
    breadcrumbs.push({
      key: '__breadcrumb_home__',
      name: options.homeName || 'layout.breadcrumb.home',
      icon: options.homeIcon || 'home',
      path: options.homePath || '/',
      clickable: true,
    });
  }

  // 从菜单路径生成面包屑（跳过与首页路径相同的项，避免重复）
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

export interface ResolvedBreadcrumbOptions {
  showHome: boolean;
  homePath: string;
  homeName: string;
  homeIcon: string;
  hideOnlyOne: boolean;
}

/**
 * 解析自动面包屑配置
 */
export function resolveAutoBreadcrumbOptions(options: {
  autoBreadcrumb?: AutoBreadcrumbConfig;
  breadcrumb?: Partial<BreadcrumbPreferences>;
  defaultHomePath?: string;
  translatedHomeName?: string;
}): ResolvedBreadcrumbOptions {
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

/**
 * 根据菜单索引生成面包屑
 */
export function resolveBreadcrumbsFromIndex(options: {
  menuIndex: ReturnType<typeof buildMenuPathIndex>;
  basePath: string;
  showHome?: boolean;
  homePath?: string;
  homeName?: string;
  homeIcon?: string;
  hideOnlyOne?: boolean;
}): BreadcrumbItem[] {
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
 * 获取菜单路径索引（从根到目标的所有父级的索引数组）
 */
export function getMenuPathIndex(menus: MenuItem[], key: string): number[] {
  const path: number[] = [];
  const stack: { item: MenuItem; index: number }[] = [];

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
 * 获取菜单项的唯一 ID
 * @param menu - 菜单项
 * @returns 菜单 ID（优先使用 key，然后是 path，最后是 name）
 */
export function getMenuId(menu: MenuItem | null | undefined): string {
  if (!menu) return '';
  const id = menu.key ?? menu.path ?? menu.name ?? '';
  return id === '' ? '' : String(id);
}

/**
 * 构建菜单路径索引（用于快速查找）
 * @param menus - 菜单列表
 * @returns 菜单索引对象
 */
export function buildMenuPathIndex(menus: MenuItem[]): {
  byPath: Map<string, MenuItem>;
  byKey: Map<string, MenuItem>;
  pathItems: MenuItem[];
  chainByKey: Map<string, string[]>;
  chainByPath: Map<string, string[]>;
  resolvedByPath: Map<string, MenuItem | undefined>;
} {
  const byPath = new Map<string, MenuItem>();
  const byKey = new Map<string, MenuItem>();
  const pathItems: MenuItem[] = [];
  const chainByKey = new Map<string, string[]>();
  const chainByPath = new Map<string, string[]>();
  const resolvedByPath = new Map<string, MenuItem | undefined>();

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

  // 按路径长度倒序，确保前缀匹配时优先命中更具体的菜单
  pathItems.sort((a, b) => (b.path?.length ?? 0) - (a.path?.length ?? 0));

  return { byPath, byKey, pathItems, chainByKey, chainByPath, resolvedByPath };
}

/**
 * 获取缓存的菜单索引（按 menus 引用缓存）
 */
let menuIndexCache = new WeakMap<MenuItem[], { length: number; index: ReturnType<typeof buildMenuPathIndex> }>();

export function getCachedMenuPathIndex(menus: MenuItem[]): ReturnType<typeof buildMenuPathIndex> {
  const cached = menuIndexCache.get(menus);
  if (cached && cached.length === menus.length) return cached.index;
  const index = buildMenuPathIndex(menus);
  menuIndexCache.set(menus, { length: menus.length, index });
  return index;
}

/**
 * 根据路径查找菜单项（支持精确匹配和前缀匹配）
 */
export function findMenuByPath(menus: MenuItem[], path: string): MenuItem | undefined {
  let exactMatch: MenuItem | undefined;
  let bestMatch: MenuItem | undefined;
  let bestMatchLength = 0;

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
 * 根据路径获取菜单路径（从根到目标的所有父级）
 * 支持通过 path 属性前缀匹配
 */
export function getMenuPathByPath(menus: MenuItem[], targetPath: string): MenuItem[] {
  let exactPath: MenuItem[] | null = null;
  let bestMatch: MenuItem[] = [];
  let bestLength = 0;
  const stack: MenuItem[] = [];

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

const trimResolvedPathCache = (index: ReturnType<typeof buildMenuPathIndex>) => {
  const cache = index.resolvedByPath;
  if (!cache) return;
  if (cache.size > RESOLVED_PATH_CACHE_LIMIT) {
    cache.clear();
  }
};

/**
 * 基于索引解析菜单（支持精确匹配与前缀匹配）
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

export interface HeaderMenuOptions {
  isHeaderNav?: boolean;
  isMixedNav?: boolean;
  isHeaderMixedNav?: boolean;
  isHeaderSidebarNav?: boolean;
}

/**
 * 解析顶部菜单数据
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
 * 解析顶部菜单数据（带缓存）
 */
let headerMenuCache = new WeakMap<MenuItem[], { length: number; menuMap: Map<string, MenuItem[]> }>();

export function getCachedHeaderMenus(
  menus: MenuItem[] | undefined,
  options: HeaderMenuOptions = {}
): MenuItem[] {
  const list = menus ?? [];
  if (!list.length) return EMPTY_MENU_LIST;
  const key = `${options.isHeaderNav ? 1 : 0}${options.isMixedNav ? 1 : 0}${options.isHeaderMixedNav ? 1 : 0}${options.isHeaderSidebarNav ? 1 : 0}`;
  const cacheEntry = headerMenuCache.get(list);
  let menuMap = cacheEntry?.menuMap;
  if (!menuMap || cacheEntry?.length !== list.length) {
    menuMap = new Map<string, MenuItem[]>();
    headerMenuCache.set(list, { length: list.length, menuMap });
  }
  const cached = menuMap.get(key);
  if (cached) return cached;
  const resolved = resolveHeaderMenus(list, options);
  menuMap.set(key, resolved);
  return resolved;
}

/**
 * 清理菜单缓存（当你原地修改 menus 时需要手动触发）
 */
export function clearMenuCaches(menus?: MenuItem[]): void {
  if (menus) {
    hiddenMenusCache.delete(menus);
    headerMenuCache.delete(menus);
    menuIndexCache.delete(menus);
    return;
  }
  hiddenMenusCache = new WeakMap<MenuItem[], { value: MenuItem[]; length: number }>();
  headerMenuCache = new WeakMap<MenuItem[], { length: number; menuMap: Map<string, MenuItem[]> }>();
  menuIndexCache = new WeakMap<MenuItem[], { length: number; index: ReturnType<typeof buildMenuPathIndex> }>();
}

export interface HeaderActiveKeyOptions extends HeaderMenuOptions {
  activeMenuKey?: string;
  currentPath?: string;
  menuIndex: ReturnType<typeof buildMenuPathIndex>;
  mixedNavRootKey?: string | null;
}

/**
 * 解析顶部菜单激活 key
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
