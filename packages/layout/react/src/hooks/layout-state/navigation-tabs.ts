/**
 * 布局标签导航状态 Hook（React）。
 * @description 统一管理标签页集合、收藏联动、KeepAlive 同步与标签操作行为。
 */
import {
  createLayoutFavoritesRuntimeController,
  createLayoutTabsManagerRuntimeController,
  createLayoutTabsActionsController,
  createLayoutTabsRefreshEffectsController,
  createLayoutTabsSyncController,
  createLayoutTabsRuntimeController,
  getOrCreateFavoritesManager,
  getOrCreateTabManager,
  resolveFavoriteMenusByKeys,
  resolveLayoutTabsStateSnapshot,
  resolveTabsRuntimeConfig,
  type TabItem,
  type TabManager,
} from '@admin-core/layout';
import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from 'react';
import { useLayoutContext, useLayoutState } from '../use-layout-context';
import { useRouter } from './router';

/**
 * 收藏管理器类型。
 * @description 由 `getOrCreateFavoritesManager` 返回值推导，保持与 core 层实现一致。
 */
type FavoritesManager = ReturnType<typeof getOrCreateFavoritesManager>;

/**
 * 标签状态快照类型。
 * @description 由 `resolveLayoutTabsStateSnapshot` 返回值推导，保持与 core 层实现一致。
 */
type TabsStateSnapshot = ReturnType<typeof resolveLayoutTabsStateSnapshot>;

/**
 * `useTabsState` 返回值。
 */
export interface UseTabsStateReturn {
  /** 当前标签列表。 */
  tabs: TabsStateSnapshot['tabs'];
  /** 当前激活标签键。 */
  activeKey: TabsStateSnapshot['activeKey'];
  /** 是否启用自动标签模式。 */
  isAutoMode: boolean;
  /** 处理标签选择。 */
  handleSelect: (key: string) => void;
  /** 处理关闭单个标签。 */
  handleClose: (key: string) => void;
  /** 关闭全部标签。 */
  handleCloseAll: () => void;
  /** 关闭除目标外的其他标签。 */
  handleCloseOther: (key: string) => void;
  /** 关闭目标标签左侧标签。 */
  handleCloseLeft: (key: string) => void;
  /** 关闭目标标签右侧标签。 */
  handleCloseRight: (key: string) => void;
  /** 刷新指定标签。 */
  handleRefresh: (key: string) => void;
  /** 切换标签固定状态。 */
  handleToggleAffix: (key: string) => void;
  /** 新窗口打开指定标签。 */
  handleOpenInNewWindow: (key: string) => void;
  /** 切换标签收藏状态。 */
  handleToggleFavorite: (key: string) => void;
  /** 批量写入收藏键集合。 */
  setFavoriteKeys: (keys: string[]) => void;
  /** 调整标签顺序。 */
  handleSort: (fromIndex: number, toIndex: number) => void;
  /** 标签管理器实例。 */
  tabManager: TabManager;
  /** 收藏管理器实例。 */
  favoriteManager: FavoritesManager;
  /** 收藏键集合。 */
  favoriteKeys: string[];
  /** 收藏菜单列表。 */
  favoriteMenus: TabsStateSnapshot['favoriteMenus'];
  /** 判断标签是否已收藏。 */
  isFavorite: (tab: TabItem) => boolean;
  /** 判断标签是否可收藏。 */
  canFavorite: (tab: TabItem) => boolean;
}

/**
 * 管理标签页状态与交互行为。
 * @description 统一处理自动标签、固定标签、收藏与 KeepAlive 刷新联动。
 * @returns 标签列表、激活项与标签操作方法。
 */
export function useTabsState(): UseTabsStateReturn {
  const context = useLayoutContext();
  const [layoutState, setState] = useLayoutState();
  const { currentPath, handleTabClick, handleTabCloseNavigate } = useRouter();

  /**
   * 自动标签模式下的内部标签缓存。
   */
  const [internalTabs, setInternalTabs] = useState<TabItem[]>([]);

  /**
   * 标签运行时配置快照。
   */
  const runtimeConfig = useMemo(
    () => resolveTabsRuntimeConfig(context.props),
    [context.props]
  );
  const {
    isAutoMode,
    maxCount,
    persistKey,
    favoritePersistKey,
    keepAliveEnabled,
  } = runtimeConfig;

  /**
   * 标签管理器引用，负责标签持久化与容量控制。
   */
  const tabManagerRef = useRef<TabManager>(
    getOrCreateTabManager({
      maxCount,
      affixTabs: context.props.autoTab?.affixKeys,
      persistKey,
      onChange: setInternalTabs,
    })
  );

  /**
   * 标签管理器运行时控制器。
   */
  const tabsManagerRuntimeController = useMemo(
    () =>
      createLayoutTabsManagerRuntimeController({
        updateOptions: (options) => tabManagerRef.current.updateOptions(options),
        clearStorage: () => tabManagerRef.current.clearStorage(),
        getTabs: () => tabManagerRef.current.getTabs(),
        setTabs: setInternalTabs,
      }),
    []
  );

  useEffect(() => {
    tabsManagerRuntimeController.syncTabs();
  }, [tabsManagerRuntimeController]);

  useEffect(() => {
    tabsManagerRuntimeController.syncOptions({ maxCount, persistKey });
  }, [tabsManagerRuntimeController, maxCount, persistKey]);

  /**
   * 收藏管理器实例。
   */
  const favoriteManager = useMemo(
    () => getOrCreateFavoritesManager({ persistKey: favoritePersistKey }),
    [favoritePersistKey]
  );

  const [favoriteKeys, setFavoriteKeysState] = useState<string[]>(() => favoriteManager.getKeys());

  /**
   * 标签视图快照，包含标签列表、映射与收藏结果。
   */
  const tabsSnapshot = useMemo(
    () =>
      resolveLayoutTabsStateSnapshot({
        props: context.props,
        currentPath,
        internalTabs,
        favoriteKeys,
        tabManager: tabManagerRef.current,
      }),
    [context.props, currentPath, internalTabs, favoriteKeys]
  );
  const tabs = tabsSnapshot.tabs;
  const tabMap = tabsSnapshot.tabMap;
  const tabsDomain = tabsSnapshot.tabsDomain;
  const activeKey = tabsSnapshot.activeKey;
  const favoriteMenus = tabsSnapshot.favoriteMenus;
  /**
   * 标签快照引用缓存。
   */
  const tabsSnapshotRef = useRef(tabsSnapshot);
  tabsSnapshotRef.current = tabsSnapshot;

  /**
   * 收藏运行时控制器，负责收藏键同步与变更事件通知。
   */
  const favoritesRuntimeController = useMemo(
    () =>
      createLayoutFavoritesRuntimeController({
        setFavoriteKeys: setFavoriteKeysState,
        resolveFavoriteMenusByKeys: (keys) =>
          resolveFavoriteMenusByKeys(tabsSnapshotRef.current.menus, keys),
        onFavoritesChange: (nextMenus, keys) => {
          context.events.onFavoritesChange?.(nextMenus, keys);
        },
      }),
    [context.events]
  );

  useEffect(() => {
    favoritesRuntimeController.bindManager(favoriteManager);
    return () => favoritesRuntimeController.unbindManager(favoriteManager);
  }, [favoriteManager, favoritesRuntimeController]);

  /**
   * 当前路径引用缓存。
   */
  const currentPathRef = useRef(currentPath);
  currentPathRef.current = currentPath;
  /**
   * 自动标签模式开关引用缓存。
   */
  const isAutoModeRef = useRef(isAutoMode);
  isAutoModeRef.current = isAutoMode;
  /**
   * 标签领域能力对象引用缓存。
   */
  const tabsDomainRef = useRef(tabsDomain);
  tabsDomainRef.current = tabsDomain;
  /**
   * 自动标签数组引用缓存。
   */
  const internalTabsRef = useRef(internalTabs);
  internalTabsRef.current = internalTabs;
  /**
   * 固定标签键集合引用缓存。
   */
  const affixKeysRef = useRef(context.props.autoTab?.affixKeys);
  affixKeysRef.current = context.props.autoTab?.affixKeys;
  /**
   * 当前标签数组引用缓存。
   */
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  /**
   * KeepAlive 开关引用缓存。
   */
  const keepAliveEnabledRef = useRef(keepAliveEnabled);
  keepAliveEnabledRef.current = keepAliveEnabled;
  /**
   * KeepAlive includes 集合引用缓存。
   */
  const keepAliveIncludesRef = useRef(layoutState.keepAliveIncludes);
  keepAliveIncludesRef.current = layoutState.keepAliveIncludes;

  /**
   * 标签运行时控制器，负责自动标签与 KeepAlive 状态同步。
   */
  const tabsRuntimeController = useMemo(
    () =>
      createLayoutTabsRuntimeController({
        getCurrentPath: () => currentPathRef.current,
        getIsAutoMode: () => isAutoModeRef.current,
        resolveMenuByPath: (path) => tabsDomainRef.current.resolveMenuByPath(path),
        buildTabForMenu: (menu, fullPath) =>
          tabsDomainRef.current.buildTabForMenu(menu, fullPath),
        addAutoTab: (tab) => tabManagerRef.current.addTab(tab),
        setAutoTabs: setInternalTabs,
        getAutoTabs: () => internalTabsRef.current,
        getAffixKeys: () => affixKeysRef.current,
        setAffixTabs: (keys) => tabManagerRef.current.setAffixTabs(keys),
        getManagedTabs: () => tabManagerRef.current.getTabs(),
        getTabs: () => tabsRef.current,
        getKeepAliveEnabled: () => keepAliveEnabledRef.current,
        getKeepAliveIncludes: () => keepAliveIncludesRef.current,
        setKeepAliveIncludes: (includes) => {
          setState((prev) =>
            prev.keepAliveIncludes === includes
              ? prev
              : { ...prev, keepAliveIncludes: includes }
          );
        },
      }),
    [setState]
  );

  /**
   * 标签同步控制器，协调路径、固定标签与收藏数据同步。
   */
  const tabsSyncController = useMemo(
    () =>
      createLayoutTabsSyncController({
        tabsRuntime: tabsRuntimeController,
        favoritesRuntime: favoritesRuntimeController,
        schedule: (task) => {
          startTransition(task);
        },
      }),
    [tabsRuntimeController, favoritesRuntimeController]
  );

  /**
   * 标签刷新副作用控制器，负责刷新键与 KeepAlive 排除列表管理。
   */
  const refreshEffectsController = useMemo(
    () =>
      createLayoutTabsRefreshEffectsController({
        getKeepAliveEnabled: () => keepAliveEnabledRef.current,
        triggerRefreshKey: () => {
          setState((prev) => ({ ...prev, refreshKey: prev.refreshKey + 1 }));
        },
        setKeepAliveExcludes: (value) => {
          setState((prev) =>
            prev.keepAliveExcludes === value
              ? prev
              : { ...prev, keepAliveExcludes: value }
          );
        },
        scheduleClearKeepAliveExcludes: (task) => {
          if (typeof queueMicrotask === 'function') {
            queueMicrotask(task);
            return;
          }
          setTimeout(task, 0);
        },
      }),
    [setState]
  );

  useEffect(() => {
    tabsSyncController.emitFavoritesChange(favoriteKeys);
  }, [favoriteKeys, tabsSyncController]);

  useEffect(() => {
    tabsSyncController.syncTabByPath();
  }, [tabsSyncController, currentPath, isAutoMode, context.props.menus]);

  useEffect(() => {
    tabsSyncController.syncAffixTabs();
  }, [tabsSyncController, context.props.autoTab?.affixKeys, isAutoMode]);

  useEffect(() => {
    tabsSyncController.syncKeepAliveIncludes();
  }, [tabsSyncController, tabs, keepAliveEnabled, layoutState.keepAliveIncludes]);

  /**
   * 标签操作控制器，封装选择、关闭、刷新、收藏等动作。
   */
  const tabsController = useMemo(
    () =>
      createLayoutTabsActionsController({
        getTabs: () => tabs,
        getActiveKey: () => activeKey,
        getTabByKey: (key) => tabMap.get(key),
        getIsAutoMode: () => isAutoMode,
        setAutoTabs: setInternalTabs,
        tabManager: tabManagerRef.current,
        favoriteManager,
        resolveTabMenu: tabsDomain.resolveTabMenu,
        resolveFavoriteMenusByKeys: (keys) =>
          favoritesRuntimeController.resolveFavoriteMenus(keys),
        handleTabClick,
        handleTabCloseNavigate,
        onRefreshActive: refreshEffectsController.handleRefreshActive,
        onRefreshTab: refreshEffectsController.handleRefreshTab,
        openInNewWindow: (url) => {
          window.open(url, '_blank');
        },
        events: context.events,
      }),
    [
      tabs,
      activeKey,
      tabMap,
      isAutoMode,
      favoriteManager,
      tabsDomain,
      favoritesRuntimeController,
      refreshEffectsController,
      handleTabClick,
      handleTabCloseNavigate,
      context.events,
    ]
  );

  /**
   * 处理标签选择。
   *
   * @param key 标签键。
   */
  const handleSelect = useCallback(
    (key: string) => tabsController.handleSelect(key),
    [tabsController]
  );

  /**
   * 处理关闭单个标签。
   *
   * @param key 标签键。
   */
  const handleClose = useCallback(
    (key: string) => tabsController.handleClose(key),
    [tabsController]
  );

  /**
   * 关闭全部标签。
   */
  const handleCloseAll = useCallback(() => {
    tabsController.handleCloseAll();
  }, [tabsController]);

  /**
   * 关闭除目标外的其他标签。
   *
   * @param key 保留的标签键。
   */
  const handleCloseOther = useCallback(
    (key: string) => tabsController.handleCloseOther(key),
    [tabsController]
  );

  /**
   * 关闭目标标签左侧标签。
   *
   * @param key 参考标签键。
   */
  const handleCloseLeft = useCallback(
    (key: string) => tabsController.handleCloseLeft(key),
    [tabsController]
  );

  /**
   * 关闭目标标签右侧标签。
   *
   * @param key 参考标签键。
   */
  const handleCloseRight = useCallback(
    (key: string) => tabsController.handleCloseRight(key),
    [tabsController]
  );

  /**
   * 刷新指定标签。
   *
   * @param key 标签键。
   */
  const handleRefresh = useCallback(
    (key: string) => tabsController.handleRefresh(key),
    [tabsController]
  );

  /**
   * 切换标签固定状态。
   *
   * @param key 标签键。
   */
  const handleToggleAffix = useCallback(
    (key: string) => tabsController.handleToggleAffix(key),
    [tabsController]
  );

  /**
   * 新窗口打开指定标签。
   *
   * @param key 标签键。
   */
  const handleOpenInNewWindow = useCallback(
    (key: string) => tabsController.handleOpenInNewWindow(key),
    [tabsController]
  );

  /**
   * 切换标签收藏状态。
   *
   * @param key 标签键。
   */
  const handleToggleFavorite = useCallback(
    (key: string) => tabsController.handleToggleFavorite(key),
    [tabsController]
  );

  /**
   * 批量写入收藏键集合。
   *
   * @param keys 收藏键数组。
   */
  const setFavoriteKeys = useCallback(
    (keys: string[]) => tabsController.setFavoriteKeys(keys),
    [tabsController]
  );

  /**
   * 调整标签顺序。
   *
   * @param fromIndex 源索引。
   * @param toIndex 目标索引。
   */
  const handleSort = useCallback(
    (fromIndex: number, toIndex: number) => tabsController.handleSort(fromIndex, toIndex),
    [tabsController]
  );

  /**
   * 判断标签是否已收藏。
   *
   * @param tab 标签项。
   * @returns 是否已收藏。
   */
  const isFavorite = useCallback(
    (tab: TabItem) => tabsController.isFavorite(tab),
    [tabsController]
  );

  /**
   * 判断标签是否允许收藏。
   *
   * @param tab 标签项。
   * @returns 是否可收藏。
   */
  const canFavorite = useCallback(
    (tab: TabItem) => tabsController.canFavorite(tab),
    [tabsController]
  );

  return {
    tabs,
    activeKey,
    isAutoMode,
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
    handleSort,
    tabManager: tabManagerRef.current,
    favoriteManager,
    favoriteKeys,
    favoriteMenus,
    isFavorite,
    canFavorite,
  };
}
