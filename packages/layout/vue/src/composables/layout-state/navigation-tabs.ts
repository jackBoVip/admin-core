/**
 * 布局标签导航状态 Composable（Vue）。
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
} from '@admin-core/layout';
import { computed, onUnmounted, ref, watch, type ComputedRef, type Ref } from 'vue';
import { useLayoutContext } from '../use-layout-context';
import { useRouter } from './router';

/**
 * 收藏管理器类型。
 * @description 由 `getOrCreateFavoritesManager` 返回值推导，保持与 core 层实现一致。
 */
type FavoritesManager = ReturnType<typeof getOrCreateFavoritesManager>;

/**
 * 标签管理器类型。
 * @description 由 `getOrCreateTabManager` 返回值推导，保持与 core 层实现一致。
 */
type TabsManager = ReturnType<typeof getOrCreateTabManager>;

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
  tabs: ComputedRef<TabsStateSnapshot['tabs']>;
  /** 当前激活标签键。 */
  activeKey: ComputedRef<TabsStateSnapshot['activeKey']>;
  /** 是否启用自动标签模式。 */
  isAutoMode: ComputedRef<boolean>;
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
  tabManager: TabsManager;
  /** 收藏管理器实例。 */
  favoriteManager: ComputedRef<FavoritesManager>;
  /** 收藏键集合。 */
  favoriteKeys: Ref<string[]>;
  /** 收藏菜单列表。 */
  favoriteMenus: ComputedRef<TabsStateSnapshot['favoriteMenus']>;
  /** 判断标签是否已收藏。 */
  isFavorite: (tab: TabItem) => boolean;
  /** 判断标签是否可收藏。 */
  canFavorite: (tab: TabItem) => boolean;
}

/**
 * 管理标签页状态与交互行为。
 * @description 统一处理自动标签、固定标签、收藏与 KeepAlive 刷新联动。
 * @returns 标签页状态、收藏状态与标签操作方法。
 */
export function useTabsState(): UseTabsStateReturn {
  /**
   * 布局上下文
   * @description 提供标签配置、菜单数据与事件分发能力。
   */
  const context = useLayoutContext();
  /**
   * 路由标签联动能力
   * @description 提供当前路径以及标签点击/关闭后的导航处理。
   */
  const { currentPath, handleTabClick, handleTabCloseNavigate } = useRouter();

  /**
   * 自动标签模式下的内部标签缓存。
   */
  const internalTabs = ref<TabItem[]>([]);

  /**
   * 标签运行时配置快照。
   */
  const runtimeConfig = computed(() => resolveTabsRuntimeConfig(context.props));
  /**
   * 是否启用自动标签模式。
   */
  const isAutoMode = computed(() => runtimeConfig.value.isAutoMode);
  /**
   * 标签数量上限。
   */
  const maxCount = computed(() => runtimeConfig.value.maxCount);
  /**
   * 标签持久化键。
   */
  const persistKey = computed(() => runtimeConfig.value.persistKey);
  /**
   * 收藏持久化键。
   */
  const favoritePersistKey = computed(() => runtimeConfig.value.favoritePersistKey);
  /**
   * 是否启用 KeepAlive。
   */
  const keepAliveEnabled = computed(() => runtimeConfig.value.keepAliveEnabled);

  /**
   * 标签管理器实例，负责标签持久化与容量控制。
   */
  const tabManager = getOrCreateTabManager({
    maxCount: maxCount.value,
    affixTabs: context.props.autoTab?.affixKeys,
    persistKey: persistKey.value,
    onChange: (tabs) => {
      internalTabs.value = tabs;
    },
  });

  /**
   * 标签管理器运行时控制器。
   */
  const tabsManagerRuntimeController = createLayoutTabsManagerRuntimeController({
    updateOptions: (options) => tabManager.updateOptions(options),
    clearStorage: () => tabManager.clearStorage(),
    getTabs: () => tabManager.getTabs(),
    setTabs: (tabs) => {
      internalTabs.value = tabs;
    },
  });

  tabsManagerRuntimeController.syncTabs();

  /**
   * 监听标签容量与持久化键变化并同步管理器配置。
   */
  watch([maxCount, persistKey], ([nextMax, nextPersist]) => {
    tabsManagerRuntimeController.syncOptions({
      maxCount: nextMax,
      persistKey: nextPersist,
    });
  }, { immediate: true });

  /**
   * 收藏管理器实例。
   */
  const favoriteManager = computed(() => getOrCreateFavoritesManager({
    persistKey: favoritePersistKey.value,
  }));

  /**
   * 当前收藏键集合。
   */
  const favoriteKeys = ref<string[]>(favoriteManager.value.getKeys());
  /**
   * 标签展示快照，含标签集合、映射与收藏结果。
   */
  const tabsSnapshot = computed(() =>
    resolveLayoutTabsStateSnapshot({
      props: context.props,
      currentPath: currentPath.value || '',
      internalTabs: internalTabs.value,
      favoriteKeys: favoriteKeys.value,
      tabManager,
    })
  );
  /**
   * 当前展示标签集合。
   */
  const tabs = computed(() => tabsSnapshot.value.tabs);
  /**
   * 标签键到标签实体映射。
   */
  const tabMap = computed(() => tabsSnapshot.value.tabMap);
  /**
   * 标签域能力集合。
   */
  const tabsDomain = computed(() => tabsSnapshot.value.tabsDomain);
  /**
   * 当前激活标签键。
   */
  const activeKey = computed(() => tabsSnapshot.value.activeKey);
  /**
   * 收藏菜单列表。
   */
  const favoriteMenus = computed(() => tabsSnapshot.value.favoriteMenus);

  /**
   * 收藏运行时控制器。
   */
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

  /**
   * 监听收藏管理器实例变化并重绑订阅。
   */
  watch(
    favoriteManager,
    (manager, prevManager) => {
      favoritesRuntimeController.bindManager(manager, prevManager);
    },
    { immediate: true }
  );

  /**
   * 组件卸载时解绑收藏管理器监听。
   */
  onUnmounted(() => {
    favoritesRuntimeController.unbindManager(favoriteManager.value);
  });

  /**
   * 标签运行时控制器，负责自动标签与 KeepAlive 状态同步。
   */
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
  /**
   * 标签同步控制器，协调路径、固定标签与收藏数据。
   */
  const tabsSyncController = createLayoutTabsSyncController({
    tabsRuntime: tabsRuntimeController,
    favoritesRuntime: favoritesRuntimeController,
  });
  /**
   * 标签刷新副作用控制器。
   */
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

  /**
   * 监听收藏键变化并对外派发收藏菜单更新事件。
   */
  watch(favoriteKeys, (nextKeys) => {
    tabsSyncController.emitFavoritesChange(nextKeys);
  }, { immediate: true });

  /**
   * 监听路径或菜单变化并同步当前路径对应标签。
   */
  watch(
    [currentPath, () => context.props.menus],
    () => {
      tabsSyncController.syncTabByPath();
    },
    { immediate: true }
  );

  /**
   * 监听固定标签配置变化并同步固定标签集合。
   */
  watch(
    () => context.props.autoTab?.affixKeys,
    () => {
      tabsSyncController.syncAffixTabs();
    }
  );

  /**
   * 监听标签集合与 KeepAlive 开关变化，刷新 include 列表。
   */
  watch(
    [tabs, keepAliveEnabled],
    () => {
      tabsSyncController.syncKeepAliveIncludes();
    },
    { immediate: true }
  );

  /**
   * 标签动作控制器，封装关闭、刷新、收藏、新窗口等操作。
   */
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

  /**
   * 处理标签选择。
   *
   * @param key 标签键。
   */
  const handleSelect = (key: string) => {
    tabsController.handleSelect(key);
  };

  /**
   * 处理关闭单个标签。
   *
   * @param key 标签键。
   */
  const handleClose = (key: string) => {
    tabsController.handleClose(key);
  };

  /**
   * 处理关闭全部标签。
   */
  const handleCloseAll = () => {
    tabsController.handleCloseAll();
  };

  /**
   * 处理关闭其他标签。
   *
   * @param key 保留标签键。
   */
  const handleCloseOther = (key: string) => {
    tabsController.handleCloseOther(key);
  };

  /**
   * 处理关闭左侧标签。
   *
   * @param key 参考标签键。
   */
  const handleCloseLeft = (key: string) => {
    tabsController.handleCloseLeft(key);
  };

  /**
   * 处理关闭右侧标签。
   *
   * @param key 参考标签键。
   */
  const handleCloseRight = (key: string) => {
    tabsController.handleCloseRight(key);
  };

  /**
   * 处理刷新标签。
   *
   * @param key 标签键。
   */
  const handleRefresh = (key: string) => {
    tabsController.handleRefresh(key);
  };

  /**
   * 切换标签固定状态。
   *
   * @param key 标签键。
   */
  const handleToggleAffix = (key: string) => {
    tabsController.handleToggleAffix(key);
  };

  /**
   * 以新窗口打开标签。
   *
   * @param key 标签键。
   */
  const handleOpenInNewWindow = (key: string) => {
    tabsController.handleOpenInNewWindow(key);
  };

  /**
   * 切换标签收藏状态。
   *
   * @param key 标签键。
   */
  const handleToggleFavorite = (key: string) => {
    tabsController.handleToggleFavorite(key);
  };

  /**
   * 批量写入收藏键集合。
   *
   * @param keys 收藏键列表。
   */
  const setFavoriteKeys = (keys: string[]) => {
    tabsController.setFavoriteKeys(keys);
  };

  /**
   * 调整标签顺序。
   *
   * @param fromIndex 源索引。
   * @param toIndex 目标索引。
   */
  const handleSort = (fromIndex: number, toIndex: number) => {
    tabsController.handleSort(fromIndex, toIndex);
  };

  /**
   * 判断标签是否已收藏。
   *
   * @param tab 标签对象。
   * @returns 是否已收藏。
   */
  const isFavorite = (tab: TabItem) => tabsController.isFavorite(tab);

  /**
   * 判断标签是否允许收藏。
   *
   * @param tab 标签对象。
   * @returns 是否可收藏。
   */
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
