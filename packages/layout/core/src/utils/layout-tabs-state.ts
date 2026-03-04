/**
 * 标签页与收藏共享状态逻辑。
 * @description 供 React/Vue 适配层复用的标签页领域状态计算与同步控制函数。
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

/** 空菜单常量，避免重复创建数组实例。 */
const EMPTY_MENUS: MenuItem[] = [];

/** 标签页运行时配置快照。 */
export interface TabsRuntimeConfig {
  /** 是否启用自动标签模式。 */
  isAutoMode: boolean;
  /** 标签栏配置。 */
  tabbarConfig: NonNullable<BasicLayoutProps['tabbar']>;
  /** 自动标签模式下最大标签数量。 */
  maxCount: number;
  /** 标签持久化键，不开启持久化时为空。 */
  persistKey?: string;
  /** 收藏菜单持久化键。 */
  favoritePersistKey: string;
  /** 是否启用 keep-alive。 */
  keepAliveEnabled: boolean;
}

/**
 * 解析收藏菜单持久化键。
 * @param autoTab 自动标签配置。
 * @returns 收藏键名。
 */
export function resolveFavoritePersistKey(
  autoTab: BasicLayoutProps['autoTab'] | undefined
): string {
  const customKey = autoTab?.favoritePersistKey;
  if (customKey) return customKey;
  const baseKey = autoTab?.persistKey || 'tabs';
  return `${baseKey}:favorites`;
}

/**
 * 从布局 props 解析 tabs 运行时配置。
 * @param props 布局配置。
 * @returns 运行时配置对象。
 */
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

/**
 * 解析菜单列表，统一返回非空数组。
 * @param menus 原始菜单。
 * @returns 菜单数组。
 */
export function resolveTabsMenus(menus: MenuItem[] | undefined): MenuItem[] {
  return menus && menus.length > 0 ? menus : EMPTY_MENUS;
}

/**
 * 将标签数组映射为 `key -> tab` 索引。
 * @param tabs 标签数组。
 * @returns 标签索引表。
 */
export function createTabMap(tabs: TabItem[]): Map<string, TabItem> {
  const map = new Map<string, TabItem>();
  for (const tab of tabs) {
    map.set(tab.key, tab);
  }
  return map;
}

/** 解析标签页状态快照所需参数。 */
export interface ResolveLayoutTabsStateSnapshotOptions {
  /** 布局配置。 */
  props: BasicLayoutProps;
  /** 当前路由路径。 */
  currentPath?: string;
  /** 自动模式维护的内部标签列表。 */
  internalTabs: TabItem[];
  /** 收藏菜单键集合。 */
  favoriteKeys: string[];
  /** 构建标签所需最小管理器能力。 */
  tabManager: Pick<TabManager, 'createTabFromMenu'>;
}

/** 标签页领域状态快照。 */
export interface LayoutTabsStateSnapshot {
  /** 运行时配置。 */
  runtimeConfig: TabsRuntimeConfig;
  /** 当前菜单集合。 */
  menus: MenuItem[];
  /** 标签页领域能力对象。 */
  tabsDomain: ReturnType<typeof createTabsDomain>;
  /** 当前展示标签。 */
  tabs: TabItem[];
  /** 标签索引表。 */
  tabMap: Map<string, TabItem>;
  /** 当前激活标签 key。 */
  activeKey: string;
  /** 收藏菜单对象列表。 */
  favoriteMenus: MenuItem[];
}

/**
 * 统一解析标签页领域快照（React/Vue 共享）。
 * @param options 快照解析参数。
 * @returns 标签页领域状态快照。
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

/**
 * 创建标签页领域对象（菜单解析、标签构建等能力）。
 * @param options 初始化参数。
 * @returns 标签页领域能力对象。
 */
export interface CreateTabsDomainOptions {
  /** 菜单列表。 */
  menus: MenuItem[];
  /** 标签构建能力。 */
  tabManager: Pick<TabManager, 'createTabFromMenu'>;
}

/**
 * 创建 tabs 领域对象（菜单解析、标签构建等能力）。
 * @param options 初始化参数。
 * @returns tabs 领域能力对象。
 */
export function createTabsDomain(options: CreateTabsDomainOptions) {
  const { menus, tabManager } = options;
  const menuIndex = getCachedMenuPathIndex(menus);

  /**
   * 通过路径解析对应菜单。
   * @param path 页面路径。
   * @returns 命中的菜单项；未命中返回 `undefined`。
   */
  const resolveMenuByPath = (path: string): MenuItem | undefined => {
    return resolveMenuByPathIndex(menuIndex, getPathWithoutQuery(path));
  };

  /**
   * 根据标签信息反查来源菜单。
   * @param tab 标签项。
   * @returns 对应菜单项；无法匹配时返回 `undefined`。
   */
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

  /**
   * 基于菜单与完整路径构建标签数据。
   * @param menu 菜单项。
   * @param fullPath 完整路径。
   * @returns 构建后的标签项。
   */
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

/** 解析当前激活标签 key 的输入参数。 */
export interface ResolveTabsActiveKeyOptions {
  /** 外部显式指定的激活 key。 */
  activeTabKey?: string;
  /** 当前路径。 */
  currentPath?: string;
  /** 是否自动标签模式。 */
  isAutoMode: boolean;
  /** 通过路径反查菜单。 */
  resolveMenuByPath: (path: string) => MenuItem | undefined;
}

/**
 * 解析当前激活标签 key。
 * @param options 解析参数。
 * @returns 激活标签 key。
 */
export function resolveTabsActiveKey(options: ResolveTabsActiveKeyOptions): string {
  const { activeTabKey, currentPath, isAutoMode, resolveMenuByPath } = options;

  if (activeTabKey) return activeTabKey;
  if (!isAutoMode || !currentPath) return currentPath || '';
  const menu = resolveMenuByPath(currentPath);
  if (!menu) return currentPath;
  return resolveTabKey(currentPath, menu);
}

/**
 * 根据收藏 key 解析收藏菜单列表。
 * @param menus 菜单列表。
 * @param keys 收藏 key。
 * @returns 收藏菜单列表。
 */
export function resolveFavoriteMenusByKeys(menus: MenuItem[], keys: string[]): MenuItem[] {
  return resolveFavoriteMenus(menus, keys);
}

/** 计算 keep-alive includes 的输入参数。 */
export interface ResolveNextKeepAliveIncludesOptions {
  /** 当前 includes。 */
  current: string[];
  /** 当前标签列表。 */
  tabs: TabItem[];
  /** 是否启用 keep-alive。 */
  keepAliveEnabled: boolean;
}

/** 保活 includes 计算结果。 */
export interface KeepAliveIncludesResolution {
  /** 下一个 includes。 */
  includes: string[];
  /** 包含列表是否发生变化。 */
  changed: boolean;
}

/**
 * 计算下一次 keep-alive includes 以及是否变化。
 * @param options 输入参数。
 * @returns includes 与变更标记。
 */
export function resolveNextKeepAliveIncludes(
  options: ResolveNextKeepAliveIncludesOptions
): KeepAliveIncludesResolution {
  const includes = resolveKeepAliveIncludes(options.tabs, options.keepAliveEnabled);
  return {
    includes,
    changed: !areArraysEqual(options.current, includes),
  };
}

/**
 * 解析标签“新窗口打开”使用的 URL。
 * @param tab 目标标签。
 * @returns 可打开的 URL；无效时为空字符串。
 */
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

/** 标签页管理器运行时同步参数。 */
export interface LayoutTabsManagerSyncOptions {
  /** 最大标签数量。 */
  maxCount: number;
  /** 持久化键。 */
  persistKey?: string;
}

/** 标签页管理器运行时控制器创建参数。 */
export interface CreateLayoutTabsManagerRuntimeControllerOptions {
  /**
   * 同步 manager 选项。
   * `maxCount` 为可选值，便于复用到初始化场景。
   */
  updateOptions: (options: Partial<LayoutTabsManagerSyncOptions>) => void;
  /** 清理持久化存储。 */
  clearStorage: () => void;
  /** 获取当前标签。 */
  getTabs: () => TabItem[];
  /** 回写标签列表。 */
  setTabs: (tabs: TabItem[]) => void;
}

/** 标签页管理器运行时控制器。 */
export interface LayoutTabsManagerRuntimeController {
  /**
   * 同步 manager 选项。
   * @param options manager 同步参数。
   */
  syncOptions: (options: LayoutTabsManagerSyncOptions) => void;
  /** 同步标签列表到外层状态。 */
  syncTabs: () => void;
}

/**
 * 创建标签页管理器运行时控制器（React/Vue 共用）。
 * @param options 运行时控制器创建参数。
 * @returns 标签页管理器运行时控制器。
 */
export function createLayoutTabsManagerRuntimeController(
  options: CreateLayoutTabsManagerRuntimeControllerOptions
): LayoutTabsManagerRuntimeController {
  let previousPersistKey: string | undefined;

  /**
   * 同步 manager 参数并处理持久化键变更。
   * @param next 最新同步参数。
   */
  const syncOptions = (next: LayoutTabsManagerSyncOptions) => {
    options.updateOptions({
      maxCount: next.maxCount,
      persistKey: next.persistKey,
    });
    if (!next.persistKey && previousPersistKey) {
      options.clearStorage();
    }
    previousPersistKey = next.persistKey;
  };

  /**
   * 将 manager 当前标签列表同步到外层状态。
   */
  const syncTabs = () => {
    options.setTabs(options.getTabs());
  };

  return {
    syncOptions,
    syncTabs,
  };
}

/** 标签页运行时同步控制器创建参数。 */
export interface CreateLayoutTabsRuntimeControllerOptions {
  /** 获取当前路径。 */
  getCurrentPath?: () => string;
  /** 是否处于自动标签模式。 */
  getIsAutoMode?: () => boolean;
  /** 通过路径反查菜单。 */
  resolveMenuByPath?: (path: string) => MenuItem | undefined;
  /** 基于菜单构建标签。 */
  buildTabForMenu?: (menu: MenuItem, fullPath: string) => TabItem;
  /** 新增自动标签并返回新列表。 */
  addAutoTab?: (tab: TabItem) => TabItem[];
  /** 写入自动标签列表。 */
  setAutoTabs?: (tabs: TabItem[]) => void;
  /** 读取自动标签列表。 */
  getAutoTabs?: () => TabItem[];
  /** 获取 affix 标签 key 列表。 */
  getAffixKeys?: () => string[] | undefined;
  /** 根据 affix key 重新整理 affix 标签。 */
  setAffixTabs?: (keys: string[]) => void;
  /** 获取 manager 计算后的标签列表。 */
  getManagedTabs?: () => TabItem[];
  /** 获取当前展示标签。 */
  getTabs?: () => TabItem[];
  /** 是否启用 keep-alive。 */
  getKeepAliveEnabled?: () => boolean;
  /** 获取当前 keep-alive includes。 */
  getKeepAliveIncludes?: () => string[];
  /** 设置 keep-alive includes。 */
  setKeepAliveIncludes?: (includes: string[]) => void;
}

/** 标签页运行时同步控制器。 */
export interface LayoutTabsRuntimeController {
  /** 基于当前路径同步标签。 */
  syncTabByPath: () => boolean;
  /** 同步 affix 标签。 */
  syncAffixTabs: () => boolean;
  /** 同步 keep-alive includes。 */
  syncKeepAliveIncludes: () => boolean;
}

/**
 * 安全读取标签 meta 字段值。
 * @param tab 标签对象。
 * @param key meta 键名。
 * @returns 对应 meta 值。
 */
function getTabMetaValue(tab: TabItem, key: string): unknown {
  const meta = tab.meta as Record<string, unknown> | undefined;
  return meta?.[key];
}

/**
 * 判断自动同步计算出的标签是否与现有标签等价。
 * @param current 当前标签。
 * @param next 目标标签。
 * @returns 是否等价。
 */
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
 * 创建 tabs 运行时控制器（React/Vue 共用）。
 * @param options 运行时依赖能力集合。
 * @returns tabs 运行时同步控制器。
 */
export function createLayoutTabsRuntimeController(
  options: CreateLayoutTabsRuntimeControllerOptions
): LayoutTabsRuntimeController {
  /**
   * 基于当前路径同步自动标签。
   * @returns 是否发生标签更新。
   */
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

  /**
   * 同步 affix 标签并回写自动标签列表。
   * @returns 是否发生标签更新。
   */
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

  /**
   * 同步 keep-alive includes。
   * @returns 是否发生 includes 更新。
   */
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

/** 收藏管理器运行时最小能力集合。 */
type FavoritesManagerRuntime = Pick<FavoritesManager, 'getKeys' | 'setOnChange'>;

/** 收藏运行时控制器创建参数。 */
export interface CreateLayoutFavoritesRuntimeControllerOptions {
  /** 回写收藏键集合。 */
  setFavoriteKeys: (keys: string[]) => void;
  /** 根据 key 解析收藏菜单。 */
  resolveFavoriteMenusByKeys: (keys: string[]) => MenuItem[];
  /** 收藏列表变化时触发。 */
  onFavoritesChange?: (menus: MenuItem[], keys: string[]) => void;
}

/** 收藏运行时控制器。 */
export interface LayoutFavoritesRuntimeController {
  /** 绑定收藏 manager。 */
  bindManager: (
    manager: FavoritesManagerRuntime,
    previousManager?: FavoritesManagerRuntime | null
  ) => void;
  /** 解绑收藏 manager。 */
  unbindManager: (manager?: FavoritesManagerRuntime | null) => void;
  /** 解析收藏菜单列表。 */
  resolveFavoriteMenus: (keys: string[]) => MenuItem[];
  /** 触发收藏变更事件。 */
  emitFavoritesChange: (keys: string[]) => void;
}

/**
 * 创建 favorites 运行时控制器（React/Vue 共用）。
 * @param options 收藏运行时参数。
 * @returns 收藏运行时控制器。
 */
export function createLayoutFavoritesRuntimeController(
  options: CreateLayoutFavoritesRuntimeControllerOptions
): LayoutFavoritesRuntimeController {
  /**
   * 同步收藏 key 到外层状态。
   *
   * @param keys 收藏 key 集合。
   */
  const syncFavoriteKeys = (keys: string[]) => {
    options.setFavoriteKeys(keys);
  };

  /**
   * 绑定收藏 manager，并在切换 manager 时清理旧订阅。
   * @param manager 当前 manager。
   * @param previousManager 上一次绑定的 manager。
   */
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

  /**
   * 解绑收藏管理器变更监听。
   *
   * @param manager 收藏管理器实例。
   */
  const unbindManager = (manager?: FavoritesManagerRuntime | null) => {
    manager?.setOnChange(undefined);
  };

  /**
   * 根据收藏 key 解析收藏菜单列表。
   *
   * @param keys 收藏 key 集合。
   * @returns 收藏菜单列表。
   */
  const resolveFavoriteMenus = (keys: string[]) => {
    return options.resolveFavoriteMenusByKeys(keys);
  };

  /**
   * 触发收藏变更事件。
   *
   * @param keys 收藏 key 集合。
   */
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

/** 标签页同步阶段需要的运行时能力切片。 */
interface LayoutTabsSyncRuntimeSlice
  extends Pick<
    LayoutTabsRuntimeController,
    'syncTabByPath' | 'syncAffixTabs' | 'syncKeepAliveIncludes'
  > {}

/** 收藏同步阶段需要的运行时能力切片。 */
interface LayoutFavoritesSyncRuntimeSlice
  extends Pick<LayoutFavoritesRuntimeController, 'emitFavoritesChange'> {}

/** 标签页同步编排控制器创建参数。 */
export interface CreateLayoutTabsSyncControllerOptions {
  /** 标签页运行时能力。 */
  tabsRuntime: LayoutTabsSyncRuntimeSlice;
  /** 收藏运行时能力。 */
  favoritesRuntime: LayoutFavoritesSyncRuntimeSlice;
  /** 任务调度器，未传时同步执行。 */
  schedule?: (task: () => void) => void;
}

/** 标签页同步编排控制器。 */
export interface LayoutTabsSyncController {
  /** 同步当前路径标签。 */
  syncTabByPath: () => void;
  /** 同步 affix 标签。 */
  syncAffixTabs: () => void;
  /** 同步 keep-alive includes。 */
  syncKeepAliveIncludes: () => void;
  /** 派发收藏变更。 */
  emitFavoritesChange: (keys: string[]) => void;
}

/**
 * 创建标签页同步编排控制器（React/Vue 共用）。
 * @param options 同步编排参数。
 * @returns 标签页同步编排控制器。
 */
export function createLayoutTabsSyncController(
  options: CreateLayoutTabsSyncControllerOptions
): LayoutTabsSyncController {
  /**
   * 统一执行调度任务；若未提供调度器则同步执行。
   *
   * @param task 待执行任务。
   */
  const runTask = (task: () => void) => {
    if (options.schedule) {
      options.schedule(task);
      return;
    }
    task();
  };

  /**
   * 调度当前路径标签同步任务。
   */
  const syncTabByPath = () => {
    runTask(() => {
      options.tabsRuntime.syncTabByPath();
    });
  };

  /**
   * 调度 affix 标签同步任务。
   */
  const syncAffixTabs = () => {
    runTask(() => {
      options.tabsRuntime.syncAffixTabs();
    });
  };

  /**
   * 调度 keep-alive includes 同步任务。
   */
  const syncKeepAliveIncludes = () => {
    runTask(() => {
      options.tabsRuntime.syncKeepAliveIncludes();
    });
  };

  /**
   * 调度收藏变更事件派发。
   *
   * @param keys 收藏 key 集合。
   */
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

/** 标签页相关事件切片。 */
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

/** 标签页交互所需的管理器方法集合。 */
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

/** 收藏交互所需的管理器方法集合。 */
type FavoritesManagerActions = Pick<FavoritesManager, 'toggle' | 'setKeys' | 'has'>;

/** 标签页交互动作控制器创建参数。 */
export interface CreateLayoutTabsActionsControllerOptions {
  /** 获取当前标签列表。 */
  getTabs: () => TabItem[];
  /** 获取当前激活标签 key。 */
  getActiveKey: () => string;
  /** 通过 key 获取标签。 */
  getTabByKey: (key: string) => TabItem | undefined;
  /** 是否自动标签模式。 */
  getIsAutoMode: () => boolean;
  /** 写入自动标签列表。 */
  setAutoTabs: (tabs: TabItem[]) => void;
  /** 标签管理能力。 */
  tabManager: TabsManagerActions;
  /** 收藏管理能力。 */
  favoriteManager: FavoritesManagerActions;
  /** 由标签反查菜单。 */
  resolveTabMenu: (tab: TabItem) => MenuItem | undefined;
  /** 根据收藏 key 解析菜单。 */
  resolveFavoriteMenusByKeys: (keys: string[]) => MenuItem[];
  /** 标签点击后的导航处理。 */
  handleTabClick: (tab: TabItem) => void;
  /** 关闭标签后的导航处理。 */
  handleTabCloseNavigate: (key: string, beforeTabs: TabItem[], activeKey: string) => void;
  /** 刷新当前激活标签时触发。 */
  onRefreshActive?: () => void;
  /** 刷新指定标签时触发。 */
  onRefreshTab?: (tab: TabItem) => void;
  /** 新窗口打开 URL 的执行器。 */
  openInNewWindow?: (url: string) => void;
  /** 标签页事件回调。 */
  events?: LayoutTabsEventsSlice;
}

/** 标签页交互动作控制器。 */
export interface LayoutTabsActionsController {
  /** 处理标签选择。 */
  handleSelect: (key: string) => boolean;
  /** 处理单个标签关闭。 */
  handleClose: (key: string) => boolean;
  /** 处理关闭全部。 */
  handleCloseAll: () => void;
  /** 处理关闭其他。 */
  handleCloseOther: (key: string) => void;
  /** 处理关闭左侧。 */
  handleCloseLeft: (key: string) => void;
  /** 处理关闭右侧。 */
  handleCloseRight: (key: string) => void;
  /** 处理刷新标签。 */
  handleRefresh: (key: string) => boolean;
  /** 切换 affix 状态。 */
  handleToggleAffix: (key: string) => void;
  /** 新窗口打开标签。 */
  handleOpenInNewWindow: (key: string) => boolean;
  /** 切换收藏状态。 */
  handleToggleFavorite: (key: string) => boolean;
  /** 批量设置收藏 key。 */
  setFavoriteKeys: (keys: string[]) => void;
  /** 判断标签是否已收藏。 */
  isFavorite: (tab: TabItem) => boolean;
  /** 判断标签是否可收藏。 */
  canFavorite: (tab: TabItem) => boolean;
  /** 调整标签排序。 */
  handleSort: (fromIndex: number, toIndex: number) => void;
}

/** 标签页刷新副作用控制器创建参数。 */
export interface CreateLayoutTabsRefreshEffectsControllerOptions {
  /** 是否启用 keep-alive。 */
  getKeepAliveEnabled: () => boolean;
  /** 触发当前激活页刷新的执行器。 */
  triggerRefreshKey: () => void;
  /** 设置临时 keep-alive 排除列表。 */
  setKeepAliveExcludes?: (includes: string[]) => void;
  /** 清理排除列表的调度器。 */
  scheduleClearKeepAliveExcludes?: (task: () => void) => void;
}

/** 标签页刷新副作用控制器。 */
export interface LayoutTabsRefreshEffectsController {
  /** 刷新当前激活页。 */
  handleRefreshActive: () => void;
  /** 刷新指定标签。 */
  handleRefreshTab: (tab: TabItem) => void;
}

/**
 * 创建标签页刷新副作用控制器（React/Vue 共用）。
 * @param options 刷新副作用控制器参数。
 * @returns 标签页刷新副作用控制器。
 */
export function createLayoutTabsRefreshEffectsController(
  options: CreateLayoutTabsRefreshEffectsControllerOptions
): LayoutTabsRefreshEffectsController {
  /**
   * 刷新当前激活页面。
   */
  const handleRefreshActive = () => {
    options.triggerRefreshKey();
  };

  /**
   * 刷新指定标签对应页面（通过 keep-alive 排除再恢复）。
   *
   * @param tab 目标标签。
   */
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
 * 创建 tabs 交互动作控制器（React/Vue 共用）。
 * @param options tabs 交互动作控制器参数。
 * @returns tabs 交互动作控制器。
 */
export function createLayoutTabsActionsController(
  options: CreateLayoutTabsActionsControllerOptions
): LayoutTabsActionsController {
  /**
   * 在自动标签模式下更新标签列表。
   *
   * @param updater 标签更新函数。
   */
  const updateAutoTabs = (updater: () => TabItem[]) => {
    if (!options.getIsAutoMode()) return;
    options.setAutoTabs(updater());
  };

  /**
   * 处理标签选择。
   * @param key 目标标签 key。
   * @returns 是否成功处理选择。
   */
  const handleSelect = (key: string): boolean => {
    const item = options.getTabByKey(key);
    if (!item) return false;
    options.handleTabClick(item);
    options.events?.onTabSelect?.(item, key);
    return true;
  };

  /**
   * 关闭单个标签。
   * @param key 目标标签 key。
   * @returns 是否成功关闭。
   */
  const handleClose = (key: string): boolean => {
    const item = options.getTabByKey(key);
    if (!item || item.closable === false) return false;
    const beforeTabs = options.getTabs();
    updateAutoTabs(() => options.tabManager.removeTab(key));
    options.handleTabCloseNavigate(key, beforeTabs, options.getActiveKey());
    options.events?.onTabClose?.(item, key);
    return true;
  };

  /**
   * 关闭全部标签并尝试激活首个剩余标签。
   */
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

  /**
   * 关闭除目标标签外的其他标签。
   *
   * @param key 目标标签键。
   */
  const handleCloseOther = (key: string) => {
    updateAutoTabs(() => options.tabManager.removeOtherTabs(key));
    options.events?.onTabCloseOther?.(key);
  };

  /**
   * 关闭目标标签左侧标签。
   *
   * @param key 目标标签键。
   */
  const handleCloseLeft = (key: string) => {
    updateAutoTabs(() => options.tabManager.removeLeftTabs(key));
  };

  /**
   * 关闭目标标签右侧标签。
   *
   * @param key 目标标签键。
   */
  const handleCloseRight = (key: string) => {
    updateAutoTabs(() => options.tabManager.removeRightTabs(key));
  };

  /**
   * 刷新指定标签。
   * @param key 目标标签 key。
   * @returns 是否触发了刷新动作。
   */
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

  /**
   * 切换标签 affix 固定状态。
   *
   * @param key 目标标签键。
   */
  const handleToggleAffix = (key: string) => {
    updateAutoTabs(() => options.tabManager.toggleAffix(key));
  };

  /**
   * 新窗口打开指定标签。
   * @param key 目标标签 key。
   * @returns 是否成功打开。
   */
  const handleOpenInNewWindow = (key: string): boolean => {
    const item = options.getTabByKey(key);
    const url = resolveTabOpenInNewWindowUrl(item);
    if (!url) return false;
    options.openInNewWindow?.(url);
    return true;
  };

  /**
   * 切换标签对应菜单的收藏状态。
   * @param key 目标标签 key。
   * @returns 是否成功切换收藏状态。
   */
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

  /**
   * 批量设置收藏 key 集合。
   *
   * @param keys 收藏 key 集合。
   */
  const setFavoriteKeys = (keys: string[]) => {
    options.favoriteManager.setKeys(keys || []);
  };

  /**
   * 判断标签对应菜单是否已收藏。
   * @param tab 目标标签。
   * @returns 是否已收藏。
   */
  const isFavorite = (tab: TabItem): boolean => {
    const menu = options.resolveTabMenu(tab);
    if (!menu) return false;
    return options.favoriteManager.has(menu.key);
  };

  /**
   * 判断标签是否可参与收藏。
   * @param tab 目标标签。
   * @returns 是否可收藏。
   */
  const canFavorite = (tab: TabItem): boolean => {
    return Boolean(options.resolveTabMenu(tab));
  };

  /**
   * 调整标签排序。
   *
   * @param fromIndex 源索引。
   * @param toIndex 目标索引。
   */
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
