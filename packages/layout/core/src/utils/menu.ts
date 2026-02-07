/**
 * 菜单工具函数
 * @description 统一管理菜单相关的逻辑（侧边栏菜单组件专用）
 */

import type { MenuItem } from '../types';

/**
 * 菜单路径索引结构
 */
export interface MenuPathIndex {
  byKey: Map<string, MenuItem>;
  byPath: Map<string, MenuItem>;
  chainByKey: Map<string, string[]>;
  chainByPath: Map<string, string[]>;
  pathItems: MenuItem[];
}

/**
 * 获取菜单项的唯一标识
 */
export function getMenuId(item: MenuItem): string {
  const id = item.key ?? item.path ?? item.name ?? '';
  return id === '' ? '' : String(id);
}

/**
 * 构建菜单路径索引
 */
export function buildMenuPathIndex(menus: MenuItem[]): MenuPathIndex {
  const byKey = new Map<string, MenuItem>();
  const byPath = new Map<string, MenuItem>();
  const chainByKey = new Map<string, string[]>();
  const chainByPath = new Map<string, string[]>();
  const pathItems: MenuItem[] = [];
  const stack: string[] = [];

  const walk = (items: MenuItem[]) => {
    for (const item of items) {
      const id = getMenuId(item);
      const rawKey = item.key ?? '';
      const key = rawKey === '' ? '' : String(rawKey);
      const rawPath = item.path ?? '';
      const path = rawPath === '' ? '' : String(rawPath);
      if (key) {
        byKey.set(key, item);
      }
      if (path) {
        byPath.set(path, item);
        pathItems.push(item);
      }
      const chain = id ? [...stack, id] : [...stack];
      if (key) {
        chainByKey.set(key, chain);
      }
      if (path) {
        chainByPath.set(path, chain);
      }
      if (id) {
        stack.push(id);
      }
      if (item.children?.length) {
        walk(item.children);
      }
      if (id) {
        stack.pop();
      }
    }
  };

  walk(menus);
  pathItems.sort((a, b) => (b.path?.length ?? 0) - (a.path?.length ?? 0));
  return { byKey, byPath, chainByKey, chainByPath, pathItems };
}

const menuIndexCache = new WeakMap<MenuItem[], MenuPathIndex>();

/**
 * 获取菜单路径索引（带缓存）
 */
export function getMenuPathIndex(menus: MenuItem[]): MenuPathIndex {
  const cached = menuIndexCache.get(menus);
  if (cached) return cached;
  const index = buildMenuPathIndex(menus);
  menuIndexCache.set(menus, index);
  return index;
}

/**
 * 判断菜单项是否有子菜单
 */
export function hasChildren(item: MenuItem): boolean {
  return Boolean(item.children?.length);
}

/**
 * 判断菜单项是否激活
 */
export function isMenuActive(item: MenuItem, activeKey: string): boolean {
  const rawKey = item.key ?? '';
  const key = rawKey === '' ? '' : String(rawKey);
  if (key && key === activeKey) return true;
  const rawPath = item.path ?? '';
  const path = rawPath === '' ? '' : String(rawPath);
  return path === activeKey;
}

/**
 * 判断菜单项是否有激活的子菜单
 */
export function hasActiveChild(item: MenuItem, activeKey: string): boolean {
  if (!item.children?.length) return false;
  const stack = [...item.children];
  while (stack.length > 0) {
    const child = stack.pop();
    if (!child) continue;
    if (isMenuActive(child, activeKey)) {
      return true;
    }
    if (child.children?.length) {
      for (let i = child.children.length - 1; i >= 0; i -= 1) {
        stack.push(child.children[i]);
      }
    }
  }
  return false;
}

/**
 * 获取菜单项的类名
 */
export function getMenuItemClassName(
  item: MenuItem,
  options: {
    level: number;
    isActive: boolean;
    isExpanded: boolean;
    hasActiveChild: boolean;
    prefix?: string;
  }
): string {
  const { level, isActive, isExpanded, hasActiveChild: hasActive, prefix = 'sidebar-menu' } = options;
  const hasChildrenItems = hasChildren(item);

  const classes = [
    `${prefix}__item`,
    `${prefix}__item--level-${level}`,
  ];
  if (isActive) classes.push(`${prefix}__item--active`);
  if (hasChildrenItems) classes.push(`${prefix}__item--has-children`);
  if (isExpanded) classes.push(`${prefix}__item--expanded`);
  if (hasActive) classes.push(`${prefix}__item--has-active-child`);
  if (item.disabled) classes.push(`${prefix}__item--disabled`);
  return classes.join(' ');
}

/**
 * 查找第一个可激活的子菜单
 */
export function findFirstActivatableChild(item: MenuItem): MenuItem | null {
  if (!item.children?.length) return null;
  
  for (const child of item.children) {
    if (child.hidden || child.disabled) continue;
    if (child.path) return child;
    const found = findFirstActivatableChild(child);
    if (found) return found;
  }
  
  return null;
}

/**
 * 获取菜单的所有父级 key
 */
export function getMenuParentKeys(menus: MenuItem[], targetKey: string): string[] {
  const keys: string[] = [];
  const stack: string[] = [];
  
  function find(items: MenuItem[]): boolean {
    for (const item of items) {
      const id = getMenuId(item);
      const rawKey = item.key ?? '';
      const key = rawKey === '' ? '' : String(rawKey);
      const rawPath = item.path ?? '';
      const path = rawPath === '' ? '' : String(rawPath);
      if (key === targetKey || path === targetKey || id === targetKey) {
        keys.push(...stack);
        return true;
      }
      if (item.children?.length) {
        if (id) {
          stack.push(id);
        }
        if (find(item.children)) {
          if (id) {
            stack.pop();
          }
          return true;
        }
        if (id) {
          stack.pop();
        }
      }
    }
    return false;
  }
  
  find(menus);
  return keys;
}

/**
 * 根据 key 查找菜单项
 */
export function findMenuByKey(menus: MenuItem[], key: string): MenuItem | null {
  const stack = [...menus].reverse();
  while (stack.length > 0) {
    const item = stack.pop();
    if (!item) continue;
    const rawKey = item.key ?? '';
    const itemKey = rawKey === '' ? '' : String(rawKey);
    if (itemKey === key) return item;
    if (item.children?.length) {
      for (let i = item.children.length - 1; i >= 0; i -= 1) {
        stack.push(item.children[i]);
      }
    }
  }
  return null;
}
