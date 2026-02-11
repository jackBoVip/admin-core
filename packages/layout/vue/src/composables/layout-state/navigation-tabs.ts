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
} from '@admin-core/layout';
import { computed, onUnmounted, ref, watch } from 'vue';
import { useLayoutContext } from '../use-layout-context';
import { useRouter } from './router';

export function useTabsState() {
  const context = useLayoutContext();
  const { currentPath, handleTabClick, handleTabCloseNavigate } = useRouter();

  const internalTabs = ref<TabItem[]>([]);

  const runtimeConfig = computed(() => resolveTabsRuntimeConfig(context.props));
  const isAutoMode = computed(() => runtimeConfig.value.isAutoMode);
  const maxCount = computed(() => runtimeConfig.value.maxCount);
  const persistKey = computed(() => runtimeConfig.value.persistKey);
  const favoritePersistKey = computed(() => runtimeConfig.value.favoritePersistKey);
  const keepAliveEnabled = computed(() => runtimeConfig.value.keepAliveEnabled);

  const tabManager = getOrCreateTabManager({
    maxCount: maxCount.value,
    affixTabs: context.props.autoTab?.affixKeys,
    persistKey: persistKey.value,
    onChange: (tabs) => {
      internalTabs.value = tabs;
    },
  });

  const tabsManagerRuntimeController = createLayoutTabsManagerRuntimeController({
    updateOptions: (options) => tabManager.updateOptions(options),
    clearStorage: () => tabManager.clearStorage(),
    getTabs: () => tabManager.getTabs(),
    setTabs: (tabs) => {
      internalTabs.value = tabs;
    },
  });

  tabsManagerRuntimeController.syncTabs();

  watch([maxCount, persistKey], ([nextMax, nextPersist]) => {
    tabsManagerRuntimeController.syncOptions({
      maxCount: nextMax,
      persistKey: nextPersist,
    });
  }, { immediate: true });

  const favoriteManager = computed(() => getOrCreateFavoritesManager({
    persistKey: favoritePersistKey.value,
  }));

  const favoriteKeys = ref<string[]>(favoriteManager.value.getKeys());
  const tabsSnapshot = computed(() =>
    resolveLayoutTabsStateSnapshot({
      props: context.props,
      currentPath: currentPath.value || '',
      internalTabs: internalTabs.value,
      favoriteKeys: favoriteKeys.value,
      tabManager,
    })
  );
  const tabs = computed(() => tabsSnapshot.value.tabs);
  const tabMap = computed(() => tabsSnapshot.value.tabMap);
  const tabsDomain = computed(() => tabsSnapshot.value.tabsDomain);
  const activeKey = computed(() => tabsSnapshot.value.activeKey);
  const favoriteMenus = computed(() => tabsSnapshot.value.favoriteMenus);

  const favoritesRuntimeController = createLayoutFavoritesRuntimeController({
    setFavoriteKeys: (keys) => {
      favoriteKeys.value = keys;
    },
    resolveFavoriteMenusByKeys: (keys) =>
      resolveFavoriteMenusByKeys(tabsSnapshot.value.menus, keys),
    onFavoritesChange: (nextMenus, keys) => {
      context.events.onFavoritesChange?.(nextMenus, keys);
    },
  });

  watch(
    favoriteManager,
    (manager, prevManager) => {
      favoritesRuntimeController.bindManager(manager, prevManager);
    },
    { immediate: true }
  );

  onUnmounted(() => {
    favoritesRuntimeController.unbindManager(favoriteManager.value);
  });

  const tabsRuntimeController = createLayoutTabsRuntimeController({
    getCurrentPath: () => currentPath.value || '',
    getIsAutoMode: () => isAutoMode.value,
    resolveMenuByPath: (path) => tabsDomain.value.resolveMenuByPath(path),
    buildTabForMenu: (menu, fullPath) => tabsDomain.value.buildTabForMenu(menu, fullPath),
    addAutoTab: (tab) => tabManager.addTab(tab),
    setAutoTabs: (nextTabs) => {
      internalTabs.value = nextTabs;
    },
    getAutoTabs: () => internalTabs.value,
    getAffixKeys: () => context.props.autoTab?.affixKeys,
    setAffixTabs: (keys) => tabManager.setAffixTabs(keys),
    getManagedTabs: () => tabManager.getTabs(),
    getTabs: () => tabs.value,
    getKeepAliveEnabled: () => keepAliveEnabled.value,
    getKeepAliveIncludes: () => context.state.keepAliveIncludes,
    setKeepAliveIncludes: (includes) => {
      context.state.keepAliveIncludes = includes;
    },
  });
  const tabsSyncController = createLayoutTabsSyncController({
    tabsRuntime: tabsRuntimeController,
    favoritesRuntime: favoritesRuntimeController,
  });
  const refreshEffectsController = createLayoutTabsRefreshEffectsController({
    getKeepAliveEnabled: () => keepAliveEnabled.value,
    triggerRefreshKey: () => {
      context.state.refreshKey += 1;
    },
    setKeepAliveExcludes: (value) => {
      context.state.keepAliveExcludes = value;
    },
    scheduleClearKeepAliveExcludes: (task) => {
      Promise.resolve().then(task);
    },
  });

  watch(favoriteKeys, (nextKeys) => {
    tabsSyncController.emitFavoritesChange(nextKeys);
  }, { immediate: true });

  watch(
    [currentPath, () => context.props.menus],
    () => {
      tabsSyncController.syncTabByPath();
    },
    { immediate: true }
  );

  watch(
    () => context.props.autoTab?.affixKeys,
    () => {
      tabsSyncController.syncAffixTabs();
    }
  );

  watch(
    [tabs, keepAliveEnabled],
    () => {
      tabsSyncController.syncKeepAliveIncludes();
    },
    { immediate: true }
  );

  const tabsController = createLayoutTabsActionsController({
    getTabs: () => tabs.value,
    getActiveKey: () => activeKey.value,
    getTabByKey: (key) => tabMap.value.get(key),
    getIsAutoMode: () => isAutoMode.value,
    setAutoTabs: (nextTabs) => {
      internalTabs.value = nextTabs;
    },
    tabManager,
    favoriteManager: {
      toggle: (key) => favoriteManager.value.toggle(key),
      setKeys: (keys) => favoriteManager.value.setKeys(keys),
      has: (key) => favoriteManager.value.has(key),
    },
    resolveTabMenu: (tab) => tabsDomain.value.resolveTabMenu(tab),
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
  });

  const handleSelect = (key: string) => {
    tabsController.handleSelect(key);
  };

  const handleClose = (key: string) => {
    tabsController.handleClose(key);
  };

  const handleCloseAll = () => {
    tabsController.handleCloseAll();
  };

  const handleCloseOther = (key: string) => {
    tabsController.handleCloseOther(key);
  };

  const handleCloseLeft = (key: string) => {
    tabsController.handleCloseLeft(key);
  };

  const handleCloseRight = (key: string) => {
    tabsController.handleCloseRight(key);
  };

  const handleRefresh = (key: string) => {
    tabsController.handleRefresh(key);
  };

  const handleToggleAffix = (key: string) => {
    tabsController.handleToggleAffix(key);
  };

  const handleOpenInNewWindow = (key: string) => {
    tabsController.handleOpenInNewWindow(key);
  };

  const handleToggleFavorite = (key: string) => {
    tabsController.handleToggleFavorite(key);
  };

  const setFavoriteKeys = (keys: string[]) => {
    tabsController.setFavoriteKeys(keys);
  };

  const handleSort = (fromIndex: number, toIndex: number) => {
    tabsController.handleSort(fromIndex, toIndex);
  };

  const isFavorite = (tab: TabItem) => tabsController.isFavorite(tab);

  const canFavorite = (tab: TabItem) => tabsController.canFavorite(tab);

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
    tabManager,
    favoriteManager,
    favoriteKeys,
    favoriteMenus,
    isFavorite,
    canFavorite,
  };
}
