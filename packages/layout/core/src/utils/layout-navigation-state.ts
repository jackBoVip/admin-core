/**
 * 导航状态公共纯函数
 * @description 提供 React/Vue 共用的 menu/breadcrumb 派生逻辑
 */

import {
  findFirstActivatableChild,
  getMenuId,
  getCachedMenuPathIndex,
  resolveAutoBreadcrumbOptions,
  resolveBreadcrumbsFromIndex,
  resolveMenuByPathIndex,
} from './menu';
import { normalizeMenuKey } from './menu-key';
import {
  resolveMenuOpenKeysOnChange,
  resolveMenuOpenKeysOnPath,
} from './menu-state';
import { getPathWithoutQuery } from './tabs';
import type {
  AutoBreadcrumbConfig,
  BreadcrumbItem,
  MenuItem,
} from '../types';
import type { BreadcrumbPreferences } from '@admin-core/preferences';

/** 空菜单常量，避免重复创建数组实例。 */
const EMPTY_MENUS: MenuItem[] = [];

/**
 * 解析菜单列表，统一返回非空数组。
 * @param menus 原始菜单列表。
 * @returns 菜单数组。
 */
export function resolveMenusOrEmpty(menus?: MenuItem[]): MenuItem[] {
  return menus && menus.length > 0 ? menus : EMPTY_MENUS;
}

/**
 * 解析菜单状态快照。
 * @param options 解析参数，包含菜单列表、当前路径与外部激活菜单 key。
 * @returns 菜单状态快照，供菜单展开、选中逻辑复用。
 */
export interface ResolveMenuStateSnapshotOptions {
  /** 菜单列表。 */
  menus?: MenuItem[];
  /** 当前路径。 */
  currentPath?: string;
  /** 外部指定的激活菜单 key。 */
  activeMenuKey?: string;
}

/**
 * 解析菜单状态快照。
 * @param options 解析参数，包含菜单列表、当前路径与外部激活菜单 key。
 * @returns 菜单状态快照，供菜单展开、选中逻辑复用。
 */
export function resolveMenuStateSnapshot(options: ResolveMenuStateSnapshotOptions) {
  const menus = resolveMenusOrEmpty(options.menus);
  const menuIndex = getCachedMenuPathIndex(menus);
  const menuPath = getPathWithoutQuery(options.currentPath || '');
  const activeKey = normalizeMenuKey(options.activeMenuKey ?? menuPath);

  return {
    menus,
    menuIndex,
    menuPath,
    activeKey,
  };
}

/**
 * 解析菜单选择 key。
 * @param value 原始 key 值。
 * @returns 标准化 key。
 */
export function resolveMenuSelectionKey(value: unknown): string {
  return normalizeMenuKey(value);
}

/** 菜单状态快照。 */
export interface LayoutMenuStateSnapshot {
  /** 菜单索引。 */
  menuIndex: ReturnType<typeof getCachedMenuPathIndex>;
  /** 当前路径（去 query）。 */
  menuPath: string;
  /** 当前展开菜单 key。 */
  openKeys: string[];
  /** 是否手风琴模式。 */
  accordion?: boolean;
}

/** 菜单状态控制器创建参数。 */
export interface CreateLayoutMenuStateControllerOptions {
  /** 获取菜单快照。 */
  getSnapshot: () => LayoutMenuStateSnapshot;
  /** 写入展开 key。 */
  setOpenKeys: (keys: string[]) => void;
}

/**
 * 面包屑展示配置解析结果。
 */
export interface BreadcrumbDisplayOptions {
  /** 是否在面包屑中展示图标。 */
  showIcon: boolean;
  /** 面包屑样式类型。 */
  styleType: string;
}

/** 菜单状态控制器。 */
export interface LayoutMenuStateController {
  /**
   * 根据当前路径同步展开 key。
   * @returns 是否发生状态更新。
   */
  syncOpenKeysByPath: () => boolean;
  /**
   * 处理菜单展开/收起变更。
   * @param nextKeys 菜单组件返回的最新展开 key 列表。
   * @returns 是否发生状态更新。
   */
  handleOpenChange: (nextKeys: string[]) => boolean;
  /**
   * 解析菜单选择项。
   * @param key 菜单组件上报的 key。
   * @returns 归一化 key 及命中的菜单项；未命中时返回 `undefined`。
   */
  resolveSelection: (
    key: string
  ) =>
    | {
        /** 标准化目标 key。 */
        target: string;
        /** 命中的菜单项。 */
        item?: MenuItem;
      }
    | undefined;
}

/**
 * 创建菜单状态控制器（React/Vue 共享）。
 * @param options 控制器依赖项，包含快照读取与展开 key 写入能力。
 * @returns 菜单状态控制器。
 */
export function createLayoutMenuStateController(
  options: CreateLayoutMenuStateControllerOptions
): LayoutMenuStateController {
  /**
   * 根据当前路径与菜单索引，自动计算并同步展开 key。
   * @returns 是否发生状态更新。
   */
  const syncOpenKeysByPath = (): boolean => {
    const snapshot = options.getSnapshot();
    if (!snapshot.menuPath) return false;
    const nextKeys = resolveMenuOpenKeysOnPath({
      menuIndex: snapshot.menuIndex,
      menuPath: snapshot.menuPath,
      openKeys: snapshot.openKeys,
      accordion: snapshot.accordion,
    });
    if (nextKeys === snapshot.openKeys) return false;
    options.setOpenKeys(nextKeys);
    return true;
  };

  /**
   * 处理菜单组件上报的展开 key 变化。
   * @param nextKeys 菜单组件返回的最新展开 key 列表。
   * @returns 是否发生状态更新。
   */
  const handleOpenChange = (nextKeys: string[]): boolean => {
    const snapshot = options.getSnapshot();
    const resolvedKeys = resolveMenuOpenKeysOnChange({
      menuIndex: snapshot.menuIndex,
      openKeys: snapshot.openKeys,
      nextKeys,
      accordion: snapshot.accordion,
    });
    if (resolvedKeys === snapshot.openKeys) return false;
    options.setOpenKeys(resolvedKeys);
    return true;
  };

  /**
   * 基于菜单 key/path 解析菜单选择结果。
   * @param key 菜单组件上报的 key。
   * @returns 标准化 key 与命中的菜单项；未命中时返回 `undefined`。
   */
  const resolveSelection = (key: string) => {
    const target = resolveMenuSelectionKey(key);
    if (!target) return undefined;
    const { menuIndex } = options.getSnapshot();
    const item = menuIndex.byKey.get(target) ?? menuIndex.byPath.get(target);
    return {
      target,
      item,
    };
  };

  return {
    syncOpenKeysByPath,
    handleOpenChange,
    resolveSelection,
  };
}

/**
 * 解析面包屑展示配置。
 * @param breadcrumb 面包屑偏好配置。
 * @returns 展示配置。
 */
export function resolveBreadcrumbDisplayOptions(
  breadcrumb: Partial<BreadcrumbPreferences> | undefined
): BreadcrumbDisplayOptions {
  return {
    showIcon: breadcrumb?.showIcon !== false,
    styleType: breadcrumb?.styleType || 'normal',
  };
}

/**
 * 解析面包屑项列表。
 * @param options 解析参数。
 * @returns 面包屑项列表。
 */
export interface ResolveBreadcrumbItemsOptions {
  /** 是否自动模式。 */
  autoMode: boolean;
  /** 外部传入面包屑。 */
  breadcrumbs?: BreadcrumbItem[];
  /** 当前路径。 */
  currentPath?: string;
  /** 菜单列表。 */
  menus?: MenuItem[];
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
 * 解析面包屑项列表。
 * @param options 解析参数。
 * @returns 面包屑项列表。
 */
export function resolveBreadcrumbItems(options: ResolveBreadcrumbItemsOptions): BreadcrumbItem[] {
  if (!options.autoMode) {
    return options.breadcrumbs || [];
  }

  const menus = resolveMenusOrEmpty(options.menus);
  const menuIndex = getCachedMenuPathIndex(menus);
  const path = options.currentPath || '';
  const basePath = getPathWithoutQuery(path);

  if (!path || menuIndex.byKey.size === 0) {
    return [];
  }

  const { showHome, homePath, homeName, homeIcon, hideOnlyOne } = resolveAutoBreadcrumbOptions({
    autoBreadcrumb: options.autoBreadcrumb,
    breadcrumb: options.breadcrumb,
    defaultHomePath: options.defaultHomePath,
    translatedHomeName: options.translatedHomeName,
  });

  return resolveBreadcrumbsFromIndex({
    menuIndex,
    basePath,
    showHome,
    homePath,
    homeName,
    homeIcon,
    hideOnlyOne,
  });
}

/** 解析面包屑状态快照所需参数。 */
export interface ResolveBreadcrumbStateSnapshotOptions {
  /** 外部传入面包屑。 */
  breadcrumbs?: BreadcrumbItem[];
  /** 当前路径。 */
  currentPath?: string;
  /** 菜单列表。 */
  menus?: MenuItem[];
  /** 自动面包屑配置。 */
  autoBreadcrumb?: AutoBreadcrumbConfig;
  /** 面包屑偏好配置。 */
  breadcrumb?: Partial<BreadcrumbPreferences>;
  /** 默认首页路径。 */
  defaultHomePath?: string;
  /** 本地化首页名称。 */
  translatedHomeName?: string;
}

/** 面包屑状态快照。 */
export interface BreadcrumbStateSnapshot {
  /** 面包屑列表。 */
  breadcrumbs: BreadcrumbItem[];
  /** 是否启用自动面包屑模式。 */
  isAutoMode: boolean;
  /** 是否展示面包屑图标。 */
  showIcon: boolean;
  /** 面包屑样式类型。 */
  styleType: string;
}

/**
 * 统一解析面包屑状态快照（React/Vue 共享）。
 * @param options 面包屑解析参数。
 * @returns 面包屑状态快照。
 */
export function resolveBreadcrumbStateSnapshot(
  options: ResolveBreadcrumbStateSnapshotOptions
): BreadcrumbStateSnapshot {
  const isAutoMode = options.autoBreadcrumb?.enabled !== false;
  const breadcrumbs = resolveBreadcrumbItems({
    autoMode: isAutoMode,
    breadcrumbs: options.breadcrumbs,
    currentPath: options.currentPath,
    menus: options.menus,
    autoBreadcrumb: options.autoBreadcrumb,
    breadcrumb: options.breadcrumb,
    defaultHomePath: options.defaultHomePath,
    translatedHomeName: options.translatedHomeName,
  });
  const displayOptions = resolveBreadcrumbDisplayOptions(options.breadcrumb);

  return {
    breadcrumbs,
    isAutoMode,
    showIcon: displayOptions.showIcon,
    styleType: displayOptions.styleType,
  };
}

/** 面包屑状态控制器创建参数。 */
export interface CreateLayoutBreadcrumbStateControllerOptions {
  /** 执行面包屑导航。 */
  navigateBreadcrumb: (item: BreadcrumbItem) => void;
  /** 点击面包屑项时触发。 */
  onBreadcrumbClick?: (item: BreadcrumbItem, key: string) => void;
}

/** 首页面包屑项的内部 key。 */
const BREADCRUMB_HOME_KEY = '__breadcrumb_home__';
/** 基于菜单 id 生成面包屑 key 的前缀。 */
const BREADCRUMB_KEY_PREFIX = '__breadcrumb_';
/** 基于菜单 id 生成面包屑 key 的后缀。 */
const BREADCRUMB_KEY_SUFFIX = '__';

/**
 * 规范化面包屑子节点配置。
 * @param children 子节点列表。
 * @param currentPath 当前路径。
 * @returns 标准化后的子节点列表。
 */
function normalizeBreadcrumbChildren(
  children: BreadcrumbItem[],
  currentPath: string
): BreadcrumbItem[] {
  const currentBasePath = getPathWithoutQuery(currentPath);

  return children
    .filter((child) => !!child)
    .map((child, index) => {
      const path = child.path ? getPathWithoutQuery(child.path) : undefined;
      const clickable = child.clickable ?? !!path;
      return {
        ...child,
        key: child.key || `__breadcrumb_child_${index}__`,
        path,
        clickable:
          clickable && (!path || path !== currentBasePath),
      };
    });
}

/**
 * 从面包屑 key 中提取菜单 id。
 * @param key 面包屑 key。
 * @returns 菜单 id。
 */
function parseMenuIdFromBreadcrumbKey(key: string): string | null {
  if (!key.startsWith(BREADCRUMB_KEY_PREFIX)) {
    return null;
  }
  if (!key.endsWith(BREADCRUMB_KEY_SUFFIX)) {
    return null;
  }
  const menuId = key.slice(BREADCRUMB_KEY_PREFIX.length, -BREADCRUMB_KEY_SUFFIX.length);
  return menuId || null;
}

/**
 * 将菜单子节点转换为面包屑子项。
 * @param children 菜单子节点。
 * @param currentPath 当前路径。
 * @returns 面包屑子项列表。
 */
function resolveMenuChildrenAsBreadcrumbItems(
  children: MenuItem[] | undefined,
  currentPath: string
): BreadcrumbItem[] {
  const currentBasePath = getPathWithoutQuery(currentPath);
  if (!children?.length) {
    return [];
  }

  return children
    .filter((child) => !child.hidden && !child.hideInBreadcrumb)
    .map((child, index) => {
      const fallbackTarget = child.path ? child : findFirstActivatableChild(child);
      const path = fallbackTarget?.path
        ? getPathWithoutQuery(fallbackTarget.path)
        : undefined;
      const menuId = getMenuId(child) || String(index);

      return {
        key: `__breadcrumb_child_${menuId}__`,
        name: child.name,
        icon: child.icon,
        path,
        clickable:
          !child.disabled && !!path && path !== currentBasePath,
      } satisfies BreadcrumbItem;
    });
}

/**
 * 解析某个面包屑项对应的子面包屑列表。
 * @param options 解析参数。
 * @returns 子面包屑列表。
 */
export interface ResolveBreadcrumbChildItemsOptions {
  /** 当前面包屑项。 */
  item: BreadcrumbItem;
  /** 菜单列表。 */
  menus?: MenuItem[];
  /** 当前路径。 */
  currentPath?: string;
}

/**
 * 解析某个面包屑项对应的子面包屑列表。
 * @param options 解析参数。
 * @returns 子面包屑列表。
 */
export function resolveBreadcrumbChildItems(
  options: ResolveBreadcrumbChildItemsOptions
): BreadcrumbItem[] {
  const currentPath = options.currentPath || '';
  if (options.item.children?.length) {
    return normalizeBreadcrumbChildren(options.item.children, currentPath);
  }

  const menus = resolveMenusOrEmpty(options.menus);
  if (!menus.length) {
    return [];
  }

  if (options.item.key === BREADCRUMB_HOME_KEY) {
    return resolveMenuChildrenAsBreadcrumbItems(menus, currentPath);
  }

  const menuIndex = getCachedMenuPathIndex(menus);
  const itemPath = options.item.path ? getPathWithoutQuery(options.item.path) : '';

  let matchedMenu: MenuItem | undefined;
  if (itemPath) {
    matchedMenu =
      menuIndex.byPath.get(itemPath) ??
      menuIndex.byKey.get(itemPath) ??
      resolveMenuByPathIndex(menuIndex, itemPath);
  }

  if (!matchedMenu && options.item.key) {
    const menuId = parseMenuIdFromBreadcrumbKey(options.item.key);
    if (menuId) {
      matchedMenu = menuIndex.byKey.get(menuId) ?? menuIndex.byPath.get(menuId);
    }
  }

  return resolveMenuChildrenAsBreadcrumbItems(matchedMenu?.children, currentPath);
}

/** 面包屑状态控制器。 */
export interface LayoutBreadcrumbStateController {
  /**
   * 处理面包屑点击。
   * @param item 被点击的面包屑项。
   * @returns 是否触发了导航行为。
   */
  handleClick: (item: BreadcrumbItem) => boolean;
}

/**
 * 创建面包屑交互控制器（React/Vue 共享）。
 * @param options 交互依赖项，包含导航执行与点击回调。
 * @returns 面包屑交互控制器。
 */
export function createLayoutBreadcrumbStateController(
  options: CreateLayoutBreadcrumbStateControllerOptions
): LayoutBreadcrumbStateController {
  /**
   * 处理面包屑点击并在可导航时触发路由跳转。
   * @param item 被点击的面包屑项。
   * @returns 是否触发了导航行为。
   */
  const handleClick = (item: BreadcrumbItem): boolean => {
    if (!item.clickable || !item.path) return false;
    options.navigateBreadcrumb(item);
    options.onBreadcrumbClick?.(item, item.key);
    return true;
  };

  return {
    handleClick,
  };
}
