/**
 * tabs/favorites 共享状态逻辑（供 React/Vue 适配层复用）
 */

import { areArraysEqual } from './array';
import { resolveFavoriteMenus, type FavoritesManager } from './favorites';
import { getCachedMenuPathIndex, resolveMenuByPathIndex } from './menu';
import {
  buildTabFromMenu,
  getTabCacheName,
  getPathWithoutQuery,
  resolveKeepAliveIncludes,
  resolveTabKey,
  type TabManager,
} from './tabs';
import type { BasicLayoutProps, LayoutEvents, MenuItem, TabItem } from '../types';

const EMPTY_MENUS: MenuItem[] = [];

export interface TabsRuntimeConfig {
  isAutoMode: boolean;
  tabbarConfig: NonNullable<BasicLayoutProps['tabbar']>;
  maxCount: number;
  persistKey?: string;
  favoritePersistKey: string;
  keepAliveEnabled: boolean;
}

export function resolveFavoritePersistKey(
  autoTab: BasicLayoutProps['autoTab'] | undefined
): string {
  const customKey = autoTab?.favoritePersistKey;
  if (customKey) return customKey;
  const baseKey = autoTab?.persistKey || 'tabs';
  return `${baseKey}:favorites`;
}

export function resolveTabsRuntimeConfig(props: BasicLayoutProps): TabsRuntimeConfig {
  const tabbarConfig = (props.tabbar || {}) as NonNullable<BasicLayoutProps['tabbar']>;
  const isAutoMode = props.autoTab?.enabled !== false;
  const maxCount = tabbarConfig.maxCount ?? props.autoTab?.maxCount ?? 0;
  const persistKey =
    tabbarConfig.persist === false
      ? undefined
      : props.autoTab?.persistKey || 'tabs';
  const favoritePersistKey = resolveFavoritePersistKey(props.autoTab);
  const keepAliveEnabled = tabbarConfig.keepAlive !== false;

  return {
    isAutoMode,
    tabbarConfig,
    maxCount,
    persistKey,
    favoritePersistKey,
    keepAliveEnabled,
  };
}

export function resolveTabsMenus(menus: MenuItem[] | undefined): MenuItem[] {
  return menus && menus.length > 0 ? menus : EMPTY_MENUS;
}

export function createTabMap(tabs: TabItem[]): Map<string, TabItem> {
  const map = new Map<string, TabItem>();
  for (const tab of tabs) {
    map.set(tab.key, tab);
  }
  return map;
}

export interface ResolveLayoutTabsStateSnapshotOptions {
  props: BasicLayoutProps;
  currentPath?: string;
  internalTabs: TabItem[];
  favoriteKeys: string[];
  tabManager: Pick<TabManager, 'createTabFromMenu'>;
}

export interface LayoutTabsStateSnapshot {
  runtimeConfig: TabsRuntimeConfig;
  menus: MenuItem[];
  tabsDomain: ReturnType<typeof createTabsDomain>;
  tabs: TabItem[];
  tabMap: Map<string, TabItem>;
  activeKey: string;
  favoriteMenus: MenuItem[];
}

/**
 * 统一解析 tabs 领域快照（React/Vue 共享）
 */
export function resolveLayoutTabsStateSnapshot(
  options: ResolveLayoutTabsStateSnapshotOptions
): LayoutTabsStateSnapshot {
  const runtimeConfig = resolveTabsRuntimeConfig(options.props);
  const menus = resolveTabsMenus(options.props.menus);
  const tabsDomain = createTabsDomain({
    menus,
    tabManager: options.tabManager,
  });
  const tabs = runtimeConfig.isAutoMode
    ? options.internalTabs
    : (options.props.tabs || []);
  const tabMap = createTabMap(tabs);
  const activeKey = resolveTabsActiveKey({
    activeTabKey: options.props.activeTabKey,
    currentPath: options.currentPath,
    isAutoMode: runtimeConfig.isAutoMode,
    resolveMenuByPath: tabsDomain.resolveMenuByPath,
  });
  const favoriteMenus = resolveFavoriteMenusByKeys(menus, options.favoriteKeys);

  return {
    runtimeConfig,
    menus,
    tabsDomain,
    tabs,
    tabMap,
    activeKey,
    favoriteMenus,
  };
}

export function createTabsDomain(options: {
  menus: MenuItem[];
  tabManager: Pick<TabManager, 'createTabFromMenu'>;
}) {
  const { menus, tabManager } = options;
  const menuIndex = getCachedMenuPathIndex(menus);

  const resolveMenuByPath = (path: string): MenuItem | undefined => {
    return resolveMenuByPathIndex(menuIndex, getPathWithoutQuery(path));
  };

  const resolveTabMenu = (tab?: TabItem): MenuItem | undefined => {
    if (!tab) return undefined;
    const meta = tab.meta as Record<string, unknown> | undefined;
    const menuKey = meta?.menuKey as string | undefined;
    if (menuKey) {
      const byKey = menuIndex.byKey.get(menuKey);
      if (byKey) return byKey;
    }
    if (tab.path) {
      return resolveMenuByPath(tab.path);
    }
    return undefined;
  };

  const buildTabForMenu = (menu: MenuItem, fullPath: string): TabItem => {
    return buildTabFromMenu(menu, fullPath, (item, builderOptions) =>
      tabManager.createTabFromMenu(item, builderOptions)
    );
  };

  return {
    menus,
    menuIndex,
    resolveMenuByPath,
    resolveTabMenu,
    buildTabForMenu,
  };
}

export function resolveTabsActiveKey(options: {
  activeTabKey?: string;
  currentPath?: string;
  isAutoMode: boolean;
  resolveMenuByPath: (path: string) => MenuItem | undefined;
}): string {
  const { activeTabKey, currentPath, isAutoMode, resolveMenuByPath } = options;

  if (activeTabKey) return activeTabKey;
  if (!isAutoMode || !currentPath) return currentPath || '';
  const menu = resolveMenuByPath(currentPath);
  if (!menu) return currentPath;
  return resolveTabKey(currentPath, menu);
}

export function resolveFavoriteMenusByKeys(menus: MenuItem[], keys: string[]): MenuItem[] {
  return resolveFavoriteMenus(menus, keys);
}

export function resolveNextKeepAliveIncludes(options: {
  current: string[];
  tabs: TabItem[];
  keepAliveEnabled: boolean;
}): { includes: string[]; changed: boolean } {
  const includes = resolveKeepAliveIncludes(options.tabs, options.keepAliveEnabled);
  return {
    includes,
    changed: !areArraysEqual(options.current, includes),
  };
}

export function resolveTabOpenInNewWindowUrl(tab?: TabItem): string {
  if (!tab) return '';
  const meta = tab.meta as Record<string, unknown> | undefined;
  return (
    (meta?.externalLink as string | undefined) ||
    (meta?.fullPath as string | undefined) ||
    tab.path ||
    ''
  );
}

export interface CreateLayoutTabsManagerRuntimeControllerOptions {
  updateOptions: (options: { maxCount?: number; persistKey?: string }) => void;
  clearStorage: () => void;
  getTabs: () => TabItem[];
  setTabs: (tabs: TabItem[]) => void;
}

export interface LayoutTabsManagerRuntimeController {
  syncOptions: (options: { maxCount: number; persistKey?: string }) => void;
  syncTabs: () => void;
}

/**
 * 创建 tabs manager 运行时控制器（React/Vue 共用）
 */
export function createLayoutTabsManagerRuntimeController(
  options: CreateLayoutTabsManagerRuntimeControllerOptions
): LayoutTabsManagerRuntimeController {
  let previousPersistKey: string | undefined;

  const syncOptions = (next: { maxCount: number; persistKey?: string }) => {
    options.updateOptions({
      maxCount: next.maxCount,
      persistKey: next.persistKey,
    });
    if (!next.persistKey && previousPersistKey) {
      options.clearStorage();
    }
    previousPersistKey = next.persistKey;
  };

  const syncTabs = () => {
    options.setTabs(options.getTabs());
  };

  return {
    syncOptions,
    syncTabs,
  };
}

export interface CreateLayoutTabsRuntimeControllerOptions {
  getCurrentPath?: () => string;
  getIsAutoMode?: () => boolean;
  resolveMenuByPath?: (path: string) => MenuItem | undefined;
  buildTabForMenu?: (menu: MenuItem, fullPath: string) => TabItem;
  addAutoTab?: (tab: TabItem) => TabItem[];
  setAutoTabs?: (tabs: TabItem[]) => void;
  getAutoTabs?: () => TabItem[];
  getAffixKeys?: () => string[] | undefined;
  setAffixTabs?: (keys: string[]) => void;
  getManagedTabs?: () => TabItem[];
  getTabs?: () => TabItem[];
  getKeepAliveEnabled?: () => boolean;
  getKeepAliveIncludes?: () => string[];
  setKeepAliveIncludes?: (includes: string[]) => void;
}

export interface LayoutTabsRuntimeController {
  syncTabByPath: () => boolean;
  syncAffixTabs: () => boolean;
  syncKeepAliveIncludes: () => boolean;
}

function getTabMetaValue(tab: TabItem, key: string): unknown {
  const meta = tab.meta as Record<string, unknown> | undefined;
  return meta?.[key];
}

function isAutoSyncedTabEqual(current: TabItem, next: TabItem): boolean {
  return (
    current.key === next.key &&
    current.path === next.path &&
    current.name === next.name &&
    current.icon === next.icon &&
    current.affix === next.affix &&
    current.closable === next.closable &&
    current.cacheName === next.cacheName &&
    getTabMetaValue(current, 'fullPath') === getTabMetaValue(next, 'fullPath') &&
    getTabMetaValue(current, 'menuKey') === getTabMetaValue(next, 'menuKey') &&
    getTabMetaValue(current, 'title') === getTabMetaValue(next, 'title') &&
    getTabMetaValue(current, 'keepAlive') === getTabMetaValue(next, 'keepAlive') &&
    getTabMetaValue(current, 'affixOrder') === getTabMetaValue(next, 'affixOrder') &&
    getTabMetaValue(current, 'externalLink') === getTabMetaValue(next, 'externalLink') &&
    getTabMetaValue(current, 'pageKey') === getTabMetaValue(next, 'pageKey') &&
    getTabMetaValue(current, 'fullPathKey') === getTabMetaValue(next, 'fullPathKey')
  );
}

/**
 * 创建 tabs 运行时控制器（React/Vue 共用）
 */
export function createLayoutTabsRuntimeController(
  options: CreateLayoutTabsRuntimeControllerOptions
): LayoutTabsRuntimeController {
  const syncTabByPath = (): boolean => {
    const getCurrentPath = options.getCurrentPath;
    const getIsAutoMode = options.getIsAutoMode;
    const getAutoTabs = options.getAutoTabs;
    const resolveMenuByPath = options.resolveMenuByPath;
    const buildTabForMenu = options.buildTabForMenu;
    const addAutoTab = options.addAutoTab;
    const setAutoTabs = options.setAutoTabs;
    if (
      !getCurrentPath ||
      !getIsAutoMode ||
      !resolveMenuByPath ||
      !buildTabForMenu ||
      !addAutoTab ||
      !setAutoTabs
    ) {
      return false;
    }

    const currentPath = getCurrentPath();
    if (!getIsAutoMode() || !currentPath) return false;

    const menu = resolveMenuByPath(currentPath);
    if (!menu || !menu.path || menu.hideInTab) return false;

    const tab = buildTabForMenu(menu, currentPath);
    const existingTab = getAutoTabs?.().find((item) => item.key === tab.key);
    if (existingTab && isAutoSyncedTabEqual(existingTab, tab)) {
      return false;
    }
    const nextTabs = addAutoTab(tab);
    setAutoTabs(nextTabs);
    return true;
  };

  const syncAffixTabs = (): boolean => {
    const getIsAutoMode = options.getIsAutoMode;
    const getAffixKeys = options.getAffixKeys;
    const setAffixTabs = options.setAffixTabs;
    const getManagedTabs = options.getManagedTabs;
    const getAutoTabs = options.getAutoTabs;
    const setAutoTabs = options.setAutoTabs;
    if (
      !getIsAutoMode ||
      !getAffixKeys ||
      !setAffixTabs ||
      !getManagedTabs ||
      !getAutoTabs ||
      !setAutoTabs
    ) {
      return false;
    }

    if (!getIsAutoMode()) return false;
    const keys = getAffixKeys();
    if (!keys) return false;
    setAffixTabs(keys);
    const nextTabs = getManagedTabs();
    if (areArraysEqual(getAutoTabs(), nextTabs)) {
      return false;
    }
    setAutoTabs(nextTabs);
    return true;
  };

  const syncKeepAliveIncludes = (): boolean => {
    const getKeepAliveIncludes = options.getKeepAliveIncludes;
    const getTabs = options.getTabs;
    const getKeepAliveEnabled = options.getKeepAliveEnabled;
    const setKeepAliveIncludes = options.setKeepAliveIncludes;
    if (!getKeepAliveIncludes || !getTabs || !getKeepAliveEnabled || !setKeepAliveIncludes) {
      return false;
    }

    const { includes, changed } = resolveNextKeepAliveIncludes({
      current: getKeepAliveIncludes(),
      tabs: getTabs(),
      keepAliveEnabled: getKeepAliveEnabled(),
    });
    if (!changed) return false;
    setKeepAliveIncludes(includes);
    return true;
  };

  return {
    syncTabByPath,
    syncAffixTabs,
    syncKeepAliveIncludes,
  };
}

type FavoritesManagerRuntime = Pick<FavoritesManager, 'getKeys' | 'setOnChange'>;

export interface CreateLayoutFavoritesRuntimeControllerOptions {
  setFavoriteKeys: (keys: string[]) => void;
  resolveFavoriteMenusByKeys: (keys: string[]) => MenuItem[];
  onFavoritesChange?: (menus: MenuItem[], keys: string[]) => void;
}

export interface LayoutFavoritesRuntimeController {
  bindManager: (
    manager: FavoritesManagerRuntime,
    previousManager?: FavoritesManagerRuntime | null
  ) => void;
  unbindManager: (manager?: FavoritesManagerRuntime | null) => void;
  resolveFavoriteMenus: (keys: string[]) => MenuItem[];
  emitFavoritesChange: (keys: string[]) => void;
}

/**
 * 创建 favorites 运行时控制器（React/Vue 共用）
 */
export function createLayoutFavoritesRuntimeController(
  options: CreateLayoutFavoritesRuntimeControllerOptions
): LayoutFavoritesRuntimeController {
  const syncFavoriteKeys = (keys: string[]) => {
    options.setFavoriteKeys(keys);
  };

  const bindManager = (
    manager: FavoritesManagerRuntime,
    previousManager?: FavoritesManagerRuntime | null
  ) => {
    if (previousManager && previousManager !== manager) {
      previousManager.setOnChange(undefined);
    }
    manager.setOnChange(syncFavoriteKeys);
    syncFavoriteKeys(manager.getKeys());
  };

  const unbindManager = (manager?: FavoritesManagerRuntime | null) => {
    manager?.setOnChange(undefined);
  };

  const resolveFavoriteMenus = (keys: string[]) => {
    return options.resolveFavoriteMenusByKeys(keys);
  };

  const emitFavoritesChange = (keys: string[]) => {
    options.onFavoritesChange?.(resolveFavoriteMenus(keys), keys);
  };

  return {
    bindManager,
    unbindManager,
    resolveFavoriteMenus,
    emitFavoritesChange,
  };
}

interface LayoutTabsSyncRuntimeSlice
  extends Pick<
    LayoutTabsRuntimeController,
    'syncTabByPath' | 'syncAffixTabs' | 'syncKeepAliveIncludes'
  > {}

interface LayoutFavoritesSyncRuntimeSlice
  extends Pick<LayoutFavoritesRuntimeController, 'emitFavoritesChange'> {}

export interface CreateLayoutTabsSyncControllerOptions {
  tabsRuntime: LayoutTabsSyncRuntimeSlice;
  favoritesRuntime: LayoutFavoritesSyncRuntimeSlice;
  schedule?: (task: () => void) => void;
}

export interface LayoutTabsSyncController {
  syncTabByPath: () => void;
  syncAffixTabs: () => void;
  syncKeepAliveIncludes: () => void;
  emitFavoritesChange: (keys: string[]) => void;
}

/**
 * 创建 tabs 同步编排控制器（React/Vue 共用）
 */
export function createLayoutTabsSyncController(
  options: CreateLayoutTabsSyncControllerOptions
): LayoutTabsSyncController {
  const runTask = (task: () => void) => {
    if (options.schedule) {
      options.schedule(task);
      return;
    }
    task();
  };

  const syncTabByPath = () => {
    runTask(() => {
      options.tabsRuntime.syncTabByPath();
    });
  };

  const syncAffixTabs = () => {
    runTask(() => {
      options.tabsRuntime.syncAffixTabs();
    });
  };

  const syncKeepAliveIncludes = () => {
    runTask(() => {
      options.tabsRuntime.syncKeepAliveIncludes();
    });
  };

  const emitFavoritesChange = (keys: string[]) => {
    runTask(() => {
      options.favoritesRuntime.emitFavoritesChange(keys);
    });
  };

  return {
    syncTabByPath,
    syncAffixTabs,
    syncKeepAliveIncludes,
    emitFavoritesChange,
  };
}

interface LayoutTabsEventsSlice
  extends Pick<
    LayoutEvents,
    | 'onTabSelect'
    | 'onTabClose'
    | 'onTabCloseAll'
    | 'onTabCloseOther'
    | 'onTabRefresh'
    | 'onTabFavoriteChange'
  > {}

type TabsManagerActions = Pick<
  TabManager,
  | 'removeTab'
  | 'removeAllTabs'
  | 'removeOtherTabs'
  | 'removeLeftTabs'
  | 'removeRightTabs'
  | 'toggleAffix'
  | 'sortTabs'
>;

type FavoritesManagerActions = Pick<FavoritesManager, 'toggle' | 'setKeys' | 'has'>;

export interface CreateLayoutTabsActionsControllerOptions {
  getTabs: () => TabItem[];
  getActiveKey: () => string;
  getTabByKey: (key: string) => TabItem | undefined;
  getIsAutoMode: () => boolean;
  setAutoTabs: (tabs: TabItem[]) => void;
  tabManager: TabsManagerActions;
  favoriteManager: FavoritesManagerActions;
  resolveTabMenu: (tab: TabItem) => MenuItem | undefined;
  resolveFavoriteMenusByKeys: (keys: string[]) => MenuItem[];
  handleTabClick: (tab: TabItem) => void;
  handleTabCloseNavigate: (key: string, beforeTabs: TabItem[], activeKey: string) => void;
  onRefreshActive?: () => void;
  onRefreshTab?: (tab: TabItem) => void;
  openInNewWindow?: (url: string) => void;
  events?: LayoutTabsEventsSlice;
}

export interface LayoutTabsActionsController {
  handleSelect: (key: string) => boolean;
  handleClose: (key: string) => boolean;
  handleCloseAll: () => void;
  handleCloseOther: (key: string) => void;
  handleCloseLeft: (key: string) => void;
  handleCloseRight: (key: string) => void;
  handleRefresh: (key: string) => boolean;
  handleToggleAffix: (key: string) => void;
  handleOpenInNewWindow: (key: string) => boolean;
  handleToggleFavorite: (key: string) => boolean;
  setFavoriteKeys: (keys: string[]) => void;
  isFavorite: (tab: TabItem) => boolean;
  canFavorite: (tab: TabItem) => boolean;
  handleSort: (fromIndex: number, toIndex: number) => void;
}

export interface CreateLayoutTabsRefreshEffectsControllerOptions {
  getKeepAliveEnabled: () => boolean;
  triggerRefreshKey: () => void;
  setKeepAliveExcludes?: (includes: string[]) => void;
  scheduleClearKeepAliveExcludes?: (task: () => void) => void;
}

export interface LayoutTabsRefreshEffectsController {
  handleRefreshActive: () => void;
  handleRefreshTab: (tab: TabItem) => void;
}

/**
 * 创建 tabs 刷新副作用控制器（React/Vue 共用）
 */
export function createLayoutTabsRefreshEffectsController(
  options: CreateLayoutTabsRefreshEffectsControllerOptions
): LayoutTabsRefreshEffectsController {
  const handleRefreshActive = () => {
    options.triggerRefreshKey();
  };

  const handleRefreshTab = (tab: TabItem) => {
    if (!options.getKeepAliveEnabled()) return;
    const cacheName = getTabCacheName(tab);
    if (!cacheName || !options.setKeepAliveExcludes) return;
    options.setKeepAliveExcludes([cacheName]);
    const schedule = options.scheduleClearKeepAliveExcludes ?? ((task: () => void) => task());
    schedule(() => {
      options.setKeepAliveExcludes?.([]);
    });
  };

  return {
    handleRefreshActive,
    handleRefreshTab,
  };
}

/**
 * 创建 tabs 交互动作控制器（React/Vue 共用）
 */
export function createLayoutTabsActionsController(
  options: CreateLayoutTabsActionsControllerOptions
): LayoutTabsActionsController {
  const updateAutoTabs = (updater: () => TabItem[]) => {
    if (!options.getIsAutoMode()) return;
    options.setAutoTabs(updater());
  };

  const handleSelect = (key: string): boolean => {
    const item = options.getTabByKey(key);
    if (!item) return false;
    options.handleTabClick(item);
    options.events?.onTabSelect?.(item, key);
    return true;
  };

  const handleClose = (key: string): boolean => {
    const item = options.getTabByKey(key);
    if (!item || item.closable === false) return false;
    const beforeTabs = options.getTabs();
    updateAutoTabs(() => options.tabManager.removeTab(key));
    options.handleTabCloseNavigate(key, beforeTabs, options.getActiveKey());
    options.events?.onTabClose?.(item, key);
    return true;
  };

  const handleCloseAll = () => {
    if (options.getIsAutoMode()) {
      const newTabs = options.tabManager.removeAllTabs();
      options.setAutoTabs(newTabs);
      const firstTab = newTabs[0];
      if (firstTab) {
        options.handleTabClick(firstTab);
      }
    }
    options.events?.onTabCloseAll?.();
  };

  const handleCloseOther = (key: string) => {
    updateAutoTabs(() => options.tabManager.removeOtherTabs(key));
    options.events?.onTabCloseOther?.(key);
  };

  const handleCloseLeft = (key: string) => {
    updateAutoTabs(() => options.tabManager.removeLeftTabs(key));
  };

  const handleCloseRight = (key: string) => {
    updateAutoTabs(() => options.tabManager.removeRightTabs(key));
  };

  const handleRefresh = (key: string): boolean => {
    let refreshed = false;
    if (key === options.getActiveKey()) {
      options.onRefreshActive?.();
      refreshed = true;
    }
    const item = options.getTabByKey(key);
    if (!item) return refreshed;
    options.onRefreshTab?.(item);
    options.events?.onTabRefresh?.(item, key);
    refreshed = true;
    return true;
  };

  const handleToggleAffix = (key: string) => {
    updateAutoTabs(() => options.tabManager.toggleAffix(key));
  };

  const handleOpenInNewWindow = (key: string): boolean => {
    const item = options.getTabByKey(key);
    const url = resolveTabOpenInNewWindowUrl(item);
    if (!url) return false;
    options.openInNewWindow?.(url);
    return true;
  };

  const handleToggleFavorite = (key: string): boolean => {
    const tab = options.getTabByKey(key);
    if (!tab) return false;
    const menu = options.resolveTabMenu(tab);
    if (!menu) return false;
    const result = options.favoriteManager.toggle(menu.key);
    const nextMenus = options.resolveFavoriteMenusByKeys(result.keys);
    options.events?.onTabFavoriteChange?.(menu, result.favorited, result.keys, nextMenus);
    return true;
  };

  const setFavoriteKeys = (keys: string[]) => {
    options.favoriteManager.setKeys(keys || []);
  };

  const isFavorite = (tab: TabItem): boolean => {
    const menu = options.resolveTabMenu(tab);
    if (!menu) return false;
    return options.favoriteManager.has(menu.key);
  };

  const canFavorite = (tab: TabItem): boolean => {
    return Boolean(options.resolveTabMenu(tab));
  };

  const handleSort = (fromIndex: number, toIndex: number) => {
    updateAutoTabs(() => options.tabManager.sortTabs(fromIndex, toIndex));
  };

  return {
    handleSelect,
    handleClose,
    handleCloseAll,
    handleCloseOther,
    handleCloseLeft,
    handleCloseRight,
    handleRefresh,
    handleToggleAffix,
    handleOpenInNewWindow,
    handleToggleFavorite,
    setFavoriteKeys,
    isFavorite,
    canFavorite,
    handleSort,
  };
}
