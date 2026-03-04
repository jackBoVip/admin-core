/**
 * 路由与导航工具
 * @description 框架无关的菜单/标签/面包屑导航逻辑
 */

import type { BreadcrumbItem, MenuItem, TabItem } from '../types';

/** 菜单导航解析结果。 */
export interface MenuNavigationResult {
  /** 类型。 */
  type: 'external' | 'internal' | 'none';
  /** 内部导航路径。 */
  path?: string;
  /** 路由参数。 */
  params?: Record<string, string | number>;
  /** 查询参数。 */
  query?: Record<string, string | number>;
  /** 外部链接 URL。 */
  url?: string;
  /** 外链打开方式。 */
  target?: '_blank' | '_self';
}

/** 菜单导航解析附加参数。 */
export interface ResolveMenuNavigationOptions {
  /** 是否自动激活第一个可用子菜单。 */
  autoActivateChild?: boolean;
}

/** 导航函数调用参数。 */
export interface NavigationHandlerNavigateOptions {
  /** 是否替换当前历史记录。 */
  replace?: boolean;
  /** 路由参数。 */
  params?: Record<string, string | number>;
  /** 查询参数。 */
  query?: Record<string, string | number>;
}

/** 类 Ref 的路径对象。 */
type CurrentPathRefLike = {
  /** 路径值。 */
  value?: string;
};

/** 当前路径输入值类型（支持类 Ref 对象）。 */
export type CurrentPathValue = CurrentPathRefLike | null | string | undefined;
/** `location` 对象最小形状。 */
export interface LocationPathLike {
  /** 路径名。 */
  pathname?: string;
  /** 查询字符串。 */
  search?: string;
  /** 哈希片段。 */
  hash?: string;
}

/** 包含路由位置信息的 window 形状。 */
export interface WindowLikeWithLocation {
  /** 路由位置对象。 */
  location: LocationPathLike;
}

/** 当前路径解析参数。 */
export interface ResolveCurrentPathOptions {
  /** 路由配置中的 `currentPath`。 */
  routerCurrentPath?: CurrentPathValue;
  /** 组件传入的当前路径。 */
  currentPath?: CurrentPathValue;
  /** 可选路由位置对象。 */
  location?: LocationPathLike | null;
  /** 路由模式。 */
  mode?: 'hash' | 'history';
  /** 可选目标 window。 */
  targetWindow?: WindowLikeWithLocation | null;
}

/**
 * 解析当前路径（支持 Ref-like 对象）。
 * @param value 当前路径输入值。
 * @returns 规范化后的路径字符串。
 */
export function resolveCurrentPath(value: CurrentPathValue): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && 'value' in value) {
    const resolved = (value as CurrentPathRefLike).value;
    return typeof resolved === 'string' ? resolved : '';
  }
  return '';
}

/**
 * 从 `location` 对象解析路径。
 * @param location location 对象。
 * @returns 解析后的路径。
 */
export function resolveLocationPath(location?: LocationPathLike | null): string {
  if (!location) return '';
  const hash = location.hash || '';
  if (hash) {
    const normalized = hash.startsWith('#') ? hash.slice(1) : hash;
    if (normalized) return normalized.startsWith('/') ? normalized : `/${normalized}`;
  }
  if (location.pathname) {
    return `${location.pathname}${location.search || ''}`;
  }
  return '';
}

/**
 * 从 `window.location` 解析路径。
 * @param preferHash 是否优先使用 hash 路径。
 * @param targetWindow 目标 window 对象。
 * @returns 解析后的路径。
 */
export function resolveWindowPath(
  preferHash: boolean,
  targetWindow?: WindowLikeWithLocation | null
): string {
  const win =
    targetWindow ??
    (typeof window !== 'undefined' ? ({ location: window.location } as WindowLikeWithLocation) : null);
  if (!win?.location) return '';

  const { pathname, search, hash } = win.location;
  if (preferHash && hash) {
    const normalized = hash.startsWith('#') ? hash.slice(1) : hash;
    if (normalized) return normalized.startsWith('/') ? normalized : `/${normalized}`;
  }
  return `${pathname || ''}${search || ''}`;
}

/**
 * 统一解析当前路径（`router.currentPath -> currentPath -> location -> window`）。
 * @param options 路径解析参数。
 * @returns 当前路径。
 */
export function resolvePreferredCurrentPath(options: ResolveCurrentPathOptions): string {
  const resolvedFromProps =
    resolveCurrentPath(options.routerCurrentPath) ||
    resolveCurrentPath(options.currentPath);
  if (resolvedFromProps) return resolvedFromProps;

  const resolvedFromLocation = resolveLocationPath(options.location);
  if (resolvedFromLocation) return resolvedFromLocation;

  const hasWindowHash = Boolean(
    options.targetWindow?.location?.hash ||
      (typeof window !== 'undefined' && window.location.hash)
  );
  const preferHash = options.mode === 'hash' || hasWindowHash;
  return resolveWindowPath(preferHash, options.targetWindow);
}

/**
 * 查找第一个可激活的菜单项（支持路径或外链）。
 * @param menus 菜单列表。
 * @returns 命中的菜单项，未命中返回 `null`。
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
 * 解析菜单导航动作（内部/外部/无动作）。
 * @param menu 菜单项。
 * @param options 解析选项。
 * @returns 菜单导航结果。
 */
export function resolveMenuNavigation(
  menu: MenuItem,
  options?: ResolveMenuNavigationOptions
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
 * 获取标签点击的目标路径。
 * @param tab 标签项。
 * @param currentPath 当前路径。
 * @returns 导航目标路径，无法导航时返回 `null`。
 */
export function getTabNavigationPath(tab: TabItem, currentPath: string): string | null {
  const meta = tab.meta as Record<string, unknown> | undefined;
  const fullPath = meta?.fullPath as string | undefined;
  const targetPath = fullPath || tab.path;
  if (targetPath && targetPath !== currentPath) return targetPath;
  return null;
}

/**
 * 获取面包屑点击的目标路径。
 * @param item 面包屑项。
 * @param currentPath 当前路径。
 * @returns 导航目标路径，无法导航时返回 `null`。
 */
export function getBreadcrumbNavigationPath(item: BreadcrumbItem, currentPath: string): string | null {
  if (item.path && item.clickable && item.path !== currentPath) return item.path;
  return null;
}

/**
 * 关闭标签后应跳转到的标签。
 * @param tabs 标签列表。
 * @param closedKey 被关闭标签 key。
 * @param activeKey 当前激活标签 key。
 * @returns 下一个应激活标签，未命中返回 `null`。
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

/** 导航处理器集合。 */
export interface NavigationHandlers {
  /**
   * 处理菜单点击。
   * @param menu 菜单项。
   */
  handleMenuItemClick: (menu: MenuItem) => void;
  /**
   * 处理标签点击。
   * @param tab 标签项。
   */
  handleTabClick: (tab: TabItem) => void;
  /**
   * 处理面包屑点击。
   * @param item 面包屑项。
   */
  handleBreadcrumbClick: (item: BreadcrumbItem) => void;
  /**
   * 处理标签关闭后的导航。
   * @param closedKey 被关闭标签 key。
   * @param tabs 当前标签列表。
   * @param activeKey 当前激活标签 key。
   */
  handleTabCloseNavigate: (closedKey: string, tabs: TabItem[], activeKey: string) => void;
}

/** 导航处理器创建参数。 */
export interface NavigationHandlerOptions {
  /** 获取当前路径。 */
  getCurrentPath: () => string;
  /** 导航函数。 */
  navigate: (
    path: string,
    options?: NavigationHandlerNavigateOptions
  ) => void;
  /** 是否自动激活第一个可用子菜单。 */
  autoActivateChild?: boolean | (() => boolean | undefined);
}

/**
 * 创建导航处理函数（菜单/标签/面包屑）。
 * @param options 控制器依赖项。
 * @returns 导航处理器集合。
 */
export function createNavigationHandlers(options: NavigationHandlerOptions): NavigationHandlers {
  /**
   * 解析当前“自动激活首个子菜单”开关。
   *
   * @returns 当前自动激活策略值。
   */
  const resolveAutoActivateChild = () =>
    typeof options.autoActivateChild === 'function'
      ? options.autoActivateChild()
      : options.autoActivateChild;

  /**
   * 菜单点击处理器。
   *
   * @param menu 被点击的菜单项。
   */
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

  /**
   * 标签点击处理器。
   *
   * @param tab 被点击的标签项。
   */
  const handleTabClick = (tab: TabItem) => {
    const targetPath = getTabNavigationPath(tab, options.getCurrentPath());
    if (targetPath) {
      options.navigate(targetPath);
    }
  };

  /**
   * 面包屑点击处理器。
   *
   * @param item 被点击的面包屑项。
   */
  const handleBreadcrumbClick = (item: BreadcrumbItem) => {
    const targetPath = getBreadcrumbNavigationPath(item, options.getCurrentPath());
    if (targetPath) {
      options.navigate(targetPath);
    }
  };

  /**
   * 标签关闭后的导航处理器。
   *
   * @param closedKey 被关闭标签 key。
   * @param tabs 当前标签列表。
   * @param activeKey 关闭前激活标签 key。
   */
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
