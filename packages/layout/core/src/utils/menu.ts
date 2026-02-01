/**
 * 菜单工具函数
 * @description 统一管理菜单相关的逻辑（侧边栏菜单组件专用）
 */

import type { MenuItem } from '../types';

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
  return item.key === activeKey || item.path === activeKey;
}

/**
 * 判断菜单项是否有激活的子菜单
 */
export function hasActiveChild(item: MenuItem, activeKey: string): boolean {
  if (!item.children?.length) return false;
  return item.children.some(
    (child) =>
      isMenuActive(child, activeKey) || hasActiveChild(child, activeKey)
  );
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

  return [
    `${prefix}__item`,
    `${prefix}__item--level-${level}`,
    isActive && `${prefix}__item--active`,
    hasChildrenItems && `${prefix}__item--has-children`,
    isExpanded && `${prefix}__item--expanded`,
    hasActive && `${prefix}__item--has-active-child`,
    item.disabled && `${prefix}__item--disabled`,
  ]
    .filter(Boolean)
    .join(' ');
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
  
  function find(items: MenuItem[], parents: string[]): boolean {
    for (const item of items) {
      if (item.key === targetKey) {
        keys.push(...parents);
        return true;
      }
      if (item.children?.length) {
        if (find(item.children, [...parents, item.key])) {
          return true;
        }
      }
    }
    return false;
  }
  
  find(menus, []);
  return keys;
}

/**
 * 根据 key 查找菜单项
 */
export function findMenuByKey(menus: MenuItem[], key: string): MenuItem | null {
  for (const item of menus) {
    if (item.key === key) return item;
    if (item.children?.length) {
      const found = findMenuByKey(item.children, key);
      if (found) return found;
    }
  }
  return null;
}
