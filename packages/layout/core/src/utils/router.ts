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

export type CurrentPathValue = string | { value?: string } | null | undefined;

/**
 * 解析当前路径（支持 Ref-like 对象）
 */
export function resolveCurrentPath(value: CurrentPathValue): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && 'value' in value) {
    const resolved = (value as { value?: unknown }).value;
    return typeof resolved === 'string' ? resolved : '';
  }
  return '';
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

export interface NavigationHandlers {
  handleMenuItemClick: (menu: MenuItem) => void;
  handleTabClick: (tab: TabItem) => void;
  handleBreadcrumbClick: (item: BreadcrumbItem) => void;
  handleTabCloseNavigate: (closedKey: string, tabs: TabItem[], activeKey: string) => void;
}

export interface NavigationHandlerOptions {
  getCurrentPath: () => string;
  navigate: (
    path: string,
    options?: {
      replace?: boolean;
      params?: Record<string, string | number>;
      query?: Record<string, string | number>;
    }
  ) => void;
  autoActivateChild?: boolean | (() => boolean | undefined);
}

/**
 * 创建导航处理函数（菜单/标签/面包屑）
 */
export function createNavigationHandlers(options: NavigationHandlerOptions): NavigationHandlers {
  const resolveAutoActivateChild = () =>
    typeof options.autoActivateChild === 'function'
      ? options.autoActivateChild()
      : options.autoActivateChild;

  const handleMenuItemClick = (menu: MenuItem) => {
    const action = resolveMenuNavigation(menu, {
      autoActivateChild: resolveAutoActivateChild(),
    });

    if (action.type === 'external' && action.url) {
      window.open(action.url, action.target ?? '_blank');
      return;
    }

    if (action.type === 'internal' && action.path) {
      options.navigate(action.path, {
        params: action.params,
        query: action.query,
      });
    }
  };

  const handleTabClick = (tab: TabItem) => {
    const targetPath = getTabNavigationPath(tab, options.getCurrentPath());
    if (targetPath) {
      options.navigate(targetPath);
    }
  };

  const handleBreadcrumbClick = (item: BreadcrumbItem) => {
    const targetPath = getBreadcrumbNavigationPath(item, options.getCurrentPath());
    if (targetPath) {
      options.navigate(targetPath);
    }
  };

  const handleTabCloseNavigate = (
    closedKey: string,
    tabs: TabItem[],
    activeKey: string
  ) => {
    const nextTab = getNextTabAfterClose(tabs, closedKey, activeKey);
    if (nextTab?.path) {
      options.navigate(nextTab.path);
    }
  };

  return {
    handleMenuItemClick,
    handleTabClick,
    handleBreadcrumbClick,
    handleTabCloseNavigate,
  };
}
