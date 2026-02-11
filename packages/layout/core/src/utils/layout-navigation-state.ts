/**
 * 导航状态公共纯函数
 * @description 提供 React/Vue 共用的 menu/breadcrumb 派生逻辑
 */

import {
  getCachedMenuPathIndex,
  resolveAutoBreadcrumbOptions,
  resolveBreadcrumbsFromIndex,
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

const EMPTY_MENUS: MenuItem[] = [];

export function resolveMenusOrEmpty(menus?: MenuItem[]): MenuItem[] {
  return menus && menus.length > 0 ? menus : EMPTY_MENUS;
}

export function resolveMenuStateSnapshot(options: {
  menus?: MenuItem[];
  currentPath?: string;
  activeMenuKey?: string;
}) {
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

export function resolveMenuSelectionKey(value: unknown): string {
  return normalizeMenuKey(value);
}

export interface LayoutMenuStateSnapshot {
  menuIndex: ReturnType<typeof getCachedMenuPathIndex>;
  menuPath: string;
  openKeys: string[];
  accordion?: boolean;
}

export interface CreateLayoutMenuStateControllerOptions {
  getSnapshot: () => LayoutMenuStateSnapshot;
  setOpenKeys: (keys: string[]) => void;
}

export interface LayoutMenuStateController {
  syncOpenKeysByPath: () => boolean;
  handleOpenChange: (nextKeys: string[]) => boolean;
  resolveSelection: (
    key: string
  ) =>
    | {
        target: string;
        item?: MenuItem;
      }
    | undefined;
}

/**
 * 创建菜单状态控制器（React/Vue 共享）
 */
export function createLayoutMenuStateController(
  options: CreateLayoutMenuStateControllerOptions
): LayoutMenuStateController {
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

export function resolveBreadcrumbDisplayOptions(
  breadcrumb: Partial<BreadcrumbPreferences> | undefined
): {
  showIcon: boolean;
  styleType: string;
} {
  return {
    showIcon: breadcrumb?.showIcon !== false,
    styleType: breadcrumb?.styleType || 'normal',
  };
}

export function resolveBreadcrumbItems(options: {
  autoMode: boolean;
  breadcrumbs?: BreadcrumbItem[];
  currentPath?: string;
  menus?: MenuItem[];
  autoBreadcrumb?: AutoBreadcrumbConfig;
  breadcrumb?: Partial<BreadcrumbPreferences>;
  defaultHomePath?: string;
  translatedHomeName?: string;
}): BreadcrumbItem[] {
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

export interface ResolveBreadcrumbStateSnapshotOptions {
  breadcrumbs?: BreadcrumbItem[];
  currentPath?: string;
  menus?: MenuItem[];
  autoBreadcrumb?: AutoBreadcrumbConfig;
  breadcrumb?: Partial<BreadcrumbPreferences>;
  defaultHomePath?: string;
  translatedHomeName?: string;
}

export interface BreadcrumbStateSnapshot {
  breadcrumbs: BreadcrumbItem[];
  isAutoMode: boolean;
  showIcon: boolean;
  styleType: string;
}

/**
 * 统一解析面包屑状态快照（React/Vue 共享）
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

export interface CreateLayoutBreadcrumbStateControllerOptions {
  navigateBreadcrumb: (item: BreadcrumbItem) => void;
  onBreadcrumbClick?: (item: BreadcrumbItem, key: string) => void;
}

export interface LayoutBreadcrumbStateController {
  handleClick: (item: BreadcrumbItem) => boolean;
}

/**
 * 创建面包屑交互控制器（React/Vue 共享）
 */
export function createLayoutBreadcrumbStateController(
  options: CreateLayoutBreadcrumbStateControllerOptions
): LayoutBreadcrumbStateController {
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
