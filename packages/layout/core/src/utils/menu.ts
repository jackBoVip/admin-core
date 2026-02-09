/**
 * 菜单工具函数
 * @description 用于处理菜单相关的逻辑
 */

import { LAYOUT_UI_TOKENS } from '../constants';
import type { MenuItem } from '../types';

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
