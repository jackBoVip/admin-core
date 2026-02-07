/**
 * 路由与导航工具
 * @description 框架无关的菜单/标签/面包屑导航逻辑
 */

import type { BreadcrumbItem, MenuItem, TabItem } from '../types';

export interface MenuNavigationResult {
  type: 'external' | 'internal' | 'none';
  path?: string;
  params?: Record<string, string | number>;
  query?: Record<string, string | number>;
  url?: string;
  target?: '_blank' | '_self';
}

/**
 * 查找第一个可激活的菜单项（支持路径或外链）
 */
export function findFirstActivatableMenuItem(menus: MenuItem[]): MenuItem | null {
  for (const menu of menus) {
    if (menu.hidden || menu.disabled) continue;
    if (menu.path || menu.externalLink) return menu;
    if (menu.children?.length) {
      const found = findFirstActivatableMenuItem(menu.children);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 解析菜单导航动作（内部/外部/无动作）
 */
export function resolveMenuNavigation(
  menu: MenuItem,
  options?: { autoActivateChild?: boolean }
): MenuNavigationResult {
  if (menu.externalLink) {
    return {
      type: 'external',
      url: menu.externalLink,
      target: menu.openInNewWindow !== false ? '_blank' : '_self',
    };
  }

  if (menu.path) {
    return {
      type: 'internal',
      path: menu.redirect || menu.path,
      params: menu.params,
      query: menu.query,
    };
  }

  if (options?.autoActivateChild && menu.children?.length) {
    const firstChild = findFirstActivatableMenuItem(menu.children);
    if (firstChild) {
      return resolveMenuNavigation(firstChild, options);
    }
  }

  return { type: 'none' };
}

/**
 * 获取标签点击的目标路径
 */
export function getTabNavigationPath(tab: TabItem, currentPath: string): string | null {
  const meta = tab.meta as Record<string, unknown> | undefined;
  const fullPath = meta?.fullPath as string | undefined;
  const targetPath = fullPath || tab.path;
  if (targetPath && targetPath !== currentPath) return targetPath;
  return null;
}

/**
 * 获取面包屑点击的目标路径
 */
export function getBreadcrumbNavigationPath(item: BreadcrumbItem, currentPath: string): string | null {
  if (item.path && item.clickable && item.path !== currentPath) return item.path;
  return null;
}

/**
 * 关闭标签后应跳转到的标签
 */
export function getNextTabAfterClose(
  tabs: TabItem[],
  closedKey: string,
  activeKey: string
): TabItem | null {
  if (closedKey !== activeKey || tabs.length === 0) return null;

  const closedIndex = tabs.findIndex((tab) => tab.key === closedKey);
  if (closedIndex === -1) return null;

  return tabs[closedIndex + 1] ?? tabs[closedIndex - 1] ?? null;
}
