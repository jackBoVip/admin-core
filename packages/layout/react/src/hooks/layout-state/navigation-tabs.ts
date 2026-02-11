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

export function useTabsState() {
  const context = useLayoutContext();
  const [layoutState, setState] = useLayoutState();
  const { currentPath, handleTabClick, handleTabCloseNavigate } = useRouter();

  const [internalTabs, setInternalTabs] = useState<TabItem[]>([]);

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

  const tabManagerRef = useRef<TabManager>(
    getOrCreateTabManager({
      maxCount,
      affixTabs: context.props.autoTab?.affixKeys,
      persistKey,
      onChange: setInternalTabs,
    })
  );

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

  const favoriteManager = useMemo(
    () => getOrCreateFavoritesManager({ persistKey: favoritePersistKey }),
    [favoritePersistKey]
  );

  const [favoriteKeys, setFavoriteKeysState] = useState<string[]>(() => favoriteManager.getKeys());

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
  const tabsSnapshotRef = useRef(tabsSnapshot);
  tabsSnapshotRef.current = tabsSnapshot;

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

  const currentPathRef = useRef(currentPath);
  currentPathRef.current = currentPath;
  const isAutoModeRef = useRef(isAutoMode);
  isAutoModeRef.current = isAutoMode;
  const tabsDomainRef = useRef(tabsDomain);
  tabsDomainRef.current = tabsDomain;
  const internalTabsRef = useRef(internalTabs);
  internalTabsRef.current = internalTabs;
  const affixKeysRef = useRef(context.props.autoTab?.affixKeys);
  affixKeysRef.current = context.props.autoTab?.affixKeys;
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  const keepAliveEnabledRef = useRef(keepAliveEnabled);
  keepAliveEnabledRef.current = keepAliveEnabled;
  const keepAliveIncludesRef = useRef(layoutState.keepAliveIncludes);
  keepAliveIncludesRef.current = layoutState.keepAliveIncludes;

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

  const handleSelect = useCallback(
    (key: string) => tabsController.handleSelect(key),
    [tabsController]
  );

  const handleClose = useCallback(
    (key: string) => tabsController.handleClose(key),
    [tabsController]
  );

  const handleCloseAll = useCallback(() => {
    tabsController.handleCloseAll();
  }, [tabsController]);

  const handleCloseOther = useCallback(
    (key: string) => tabsController.handleCloseOther(key),
    [tabsController]
  );

  const handleCloseLeft = useCallback(
    (key: string) => tabsController.handleCloseLeft(key),
    [tabsController]
  );

  const handleCloseRight = useCallback(
    (key: string) => tabsController.handleCloseRight(key),
    [tabsController]
  );

  const handleRefresh = useCallback(
    (key: string) => tabsController.handleRefresh(key),
    [tabsController]
  );

  const handleToggleAffix = useCallback(
    (key: string) => tabsController.handleToggleAffix(key),
    [tabsController]
  );

  const handleOpenInNewWindow = useCallback(
    (key: string) => tabsController.handleOpenInNewWindow(key),
    [tabsController]
  );

  const handleToggleFavorite = useCallback(
    (key: string) => tabsController.handleToggleFavorite(key),
    [tabsController]
  );

  const setFavoriteKeys = useCallback(
    (keys: string[]) => tabsController.setFavoriteKeys(keys),
    [tabsController]
  );

  const handleSort = useCallback(
    (fromIndex: number, toIndex: number) => tabsController.handleSort(fromIndex, toIndex),
    [tabsController]
  );

  const isFavorite = useCallback(
    (tab: TabItem) => tabsController.isFavorite(tab),
    [tabsController]
  );

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
