import { describe, expect, it } from 'vitest';
import {
  createLayoutFavoritesRuntimeController,
  createLayoutTabsManagerRuntimeController,
  createLayoutTabsActionsController,
  createLayoutTabsRefreshEffectsController,
  createLayoutTabsRuntimeController,
  createLayoutTabsSyncController,
  createTabsDomain,
  resolveLayoutTabsStateSnapshot,
  resolveNextKeepAliveIncludes,
  resolveTabOpenInNewWindowUrl,
  resolveTabsActiveKey,
  resolveTabsMenus,
  resolveTabsRuntimeConfig,
} from '../utils';
import type { MenuItem } from '../types';

describe('layout-tabs-state helpers', () => {
  it('should resolve runtime config from layout props', () => {
    const config = resolveTabsRuntimeConfig({
      autoTab: {
        enabled: true,
        maxCount: 6,
        persistKey: 'my-tabs',
      },
      tabbar: {
        keepAlive: false,
      },
    });

    expect(config.isAutoMode).toBe(true);
    expect(config.maxCount).toBe(6);
    expect(config.persistKey).toBe('my-tabs');
    expect(config.favoritePersistKey).toBe('my-tabs:favorites');
    expect(config.keepAliveEnabled).toBe(false);
  });

  it('should resolve unified tabs state snapshot', () => {
    const snapshot = resolveLayoutTabsStateSnapshot({
      props: {
        autoTab: {
          enabled: true,
        },
        activeTabKey: '',
        menus: [{ key: 'workbench', name: 'workbench', path: '/workbench' }],
      },
      currentPath: '/workbench?from=home',
      internalTabs: [
        { key: '/workbench', name: 'workbench', path: '/workbench' },
      ],
      favoriteKeys: ['workbench'],
      tabManager: {
        createTabFromMenu: (menu) => ({
          key: menu.key,
          name: menu.name,
          path: menu.path || '',
        }),
      },
    });

    expect(snapshot.runtimeConfig.isAutoMode).toBe(true);
    expect(snapshot.tabs).toHaveLength(1);
    expect(snapshot.activeKey).toBe('/workbench?from=home');
    expect(snapshot.tabMap.get('/workbench')?.name).toBe('workbench');
    expect(snapshot.favoriteMenus.map((item) => item.key)).toEqual(['workbench']);
  });

  it('should resolve menus fallback and domain helpers', () => {
    const menus: MenuItem[] = [
      { key: 'workbench', name: 'workbench', path: '/workbench' },
      {
        key: 'system',
        name: 'system',
        path: '/system',
        children: [{ key: 'user', name: 'user', path: '/system/user' }],
      },
    ];

    const domain = createTabsDomain({
      menus: resolveTabsMenus(menus),
      tabManager: {
        createTabFromMenu: (menu) => ({
          key: menu.key,
          name: menu.name,
          path: menu.path || '',
          closable: !menu.affix,
          affix: !!menu.affix,
          icon: menu.icon,
          meta: menu.meta,
        }),
      },
    });

    const menu = domain.resolveMenuByPath('/system/user?id=1');
    expect(menu?.key).toBe('user');
    if (!menu) {
      throw new Error('expected menu to be resolved');
    }

    const tab = domain.buildTabForMenu(menu, '/system/user?id=1');
    expect(tab.path).toBe('/system/user?id=1');
    expect(tab.meta?.fullPath).toBe('/system/user?id=1');
  });

  it('should resolve active key by configured priority', () => {
    const menus: MenuItem[] = [{ key: 'workbench', name: 'workbench', path: '/workbench' }];
    const domain = createTabsDomain({
      menus,
      tabManager: {
        createTabFromMenu: (menu) => ({
          key: menu.key,
          name: menu.name,
          path: menu.path || '',
        }),
      },
    });

    expect(
      resolveTabsActiveKey({
        activeTabKey: 'fixed-key',
        currentPath: '/workbench',
        isAutoMode: true,
        resolveMenuByPath: domain.resolveMenuByPath,
      })
    ).toBe('fixed-key');

    expect(
      resolveTabsActiveKey({
        currentPath: '/workbench',
        isAutoMode: true,
        resolveMenuByPath: domain.resolveMenuByPath,
      })
    ).toBe('/workbench');
  });

  it('should resolve keep-alive includes with changed flag', () => {
    const tabs = [
      { key: 'a', name: 'A', path: '/a', cacheName: 'PageA' },
      { key: 'b', name: 'B', path: '/b', cacheName: 'PageB', meta: { keepAlive: false } },
    ];

    const first = resolveNextKeepAliveIncludes({
      current: [],
      tabs,
      keepAliveEnabled: true,
    });
    expect(first.includes).toEqual(['PageA']);
    expect(first.changed).toBe(true);

    const second = resolveNextKeepAliveIncludes({
      current: ['PageA'],
      tabs,
      keepAliveEnabled: true,
    });
    expect(second.changed).toBe(false);
  });

  it('should resolve open-in-new-window url by priority', () => {
    expect(
      resolveTabOpenInNewWindowUrl({
        key: 'a',
        name: 'A',
        path: '/a',
        meta: { externalLink: 'https://example.com' },
      })
    ).toBe('https://example.com');

    expect(
      resolveTabOpenInNewWindowUrl({
        key: 'b',
        name: 'B',
        path: '/b',
        meta: { fullPath: '/b?x=1' },
      })
    ).toBe('/b?x=1');
  });

  it('should execute tab action controller handlers in auto mode', () => {
    let tabs = [
      { key: 'a', name: 'A', path: '/a' },
      { key: 'b', name: 'B', path: '/b', closable: false },
    ];
    let activeKey = 'a';
    const events = {
      tabSelect: '',
      tabClose: '',
      closeAll: 0,
      closeOther: '',
      tabRefresh: '',
    };
    const selectedTabs: string[] = [];
    const closeNavigate: string[] = [];
    let refreshActiveCount = 0;
    const openedUrls: string[] = [];

    const tabManager = {
      removeTab: (key: string) => tabs.filter((item) => item.key !== key),
      removeAllTabs: () => [],
      removeOtherTabs: (key: string) => tabs.filter((item) => item.key === key),
      removeLeftTabs: () => tabs,
      removeRightTabs: () => tabs,
      toggleAffix: () => tabs,
      sortTabs: () => tabs,
    };

    const favoriteManager = {
      toggle: () => ({ keys: ['a'], favorited: true }),
      setKeys: () => ['a'],
      has: (key: string) => key === 'a',
    };

    const controller = createLayoutTabsActionsController({
      getTabs: () => tabs,
      getActiveKey: () => activeKey,
      getTabByKey: (key) => tabs.find((item) => item.key === key),
      getIsAutoMode: () => true,
      setAutoTabs: (next) => {
        tabs = next;
      },
      tabManager,
      favoriteManager,
      resolveTabMenu: (tab) => ({ key: tab.key, name: tab.name, path: tab.path }),
      resolveFavoriteMenusByKeys: (keys) => keys.map((key) => ({ key, name: key, path: `/${key}` })),
      handleTabClick: (tab) => selectedTabs.push(tab.key),
      handleTabCloseNavigate: (key) => closeNavigate.push(key),
      onRefreshActive: () => {
        refreshActiveCount += 1;
      },
      openInNewWindow: (url) => openedUrls.push(url),
      events: {
        onTabSelect: (_item, key) => {
          events.tabSelect = key;
        },
        onTabClose: (_item, key) => {
          events.tabClose = key;
        },
        onTabCloseAll: () => {
          events.closeAll += 1;
        },
        onTabCloseOther: (key) => {
          events.closeOther = key;
        },
        onTabRefresh: (_item, key) => {
          events.tabRefresh = key;
        },
      },
    });

    expect(controller.handleSelect('a')).toBe(true);
    expect(events.tabSelect).toBe('a');
    expect(selectedTabs).toEqual(['a']);

    expect(controller.handleClose('b')).toBe(false);
    expect(controller.handleClose('a')).toBe(true);
    expect(events.tabClose).toBe('a');
    expect(closeNavigate).toEqual(['a']);
    expect(tabs.map((item) => item.key)).toEqual(['b']);

    tabs = [{ key: 'a', name: 'A', path: '/a' }];
    activeKey = 'a';
    expect(controller.handleRefresh('a')).toBe(true);
    expect(refreshActiveCount).toBe(1);
    expect(events.tabRefresh).toBe('a');

    tabs = [{ key: 'a', name: 'A', path: '/a', meta: { fullPath: '/a?x=1' } }];
    expect(controller.handleOpenInNewWindow('a')).toBe(true);
    expect(openedUrls).toEqual(['/a?x=1']);

    controller.handleCloseOther('a');
    expect(events.closeOther).toBe('a');

    controller.handleCloseAll();
    expect(events.closeAll).toBe(1);
    expect(tabs).toEqual([]);
  });

  it('should handle favorites in tab action controller', () => {
    const tabs = [{ key: 'a', name: 'A', path: '/a' }];
    const favoriteStates = new Set<string>();
    let latestFavoriteEvent: string | null = null;

    const controller = createLayoutTabsActionsController({
      getTabs: () => tabs,
      getActiveKey: () => 'a',
      getTabByKey: (key) => tabs.find((item) => item.key === key),
      getIsAutoMode: () => false,
      setAutoTabs: () => {},
      tabManager: {
        removeTab: () => tabs,
        removeAllTabs: () => tabs,
        removeOtherTabs: () => tabs,
        removeLeftTabs: () => tabs,
        removeRightTabs: () => tabs,
        toggleAffix: () => tabs,
        sortTabs: () => tabs,
      },
      favoriteManager: {
        toggle: (key) => {
          if (favoriteStates.has(key)) {
            favoriteStates.delete(key);
            return { keys: [...favoriteStates], favorited: false };
          }
          favoriteStates.add(key);
          return { keys: [...favoriteStates], favorited: true };
        },
        setKeys: (keys) => {
          favoriteStates.clear();
          keys.forEach((key) => favoriteStates.add(key));
          return [...favoriteStates];
        },
        has: (key) => favoriteStates.has(key),
      },
      resolveTabMenu: (tab) => ({ key: tab.key, name: tab.name, path: tab.path }),
      resolveFavoriteMenusByKeys: (keys) => keys.map((key) => ({ key, name: key, path: `/${key}` })),
      handleTabClick: () => {},
      handleTabCloseNavigate: () => {},
      events: {
        onTabFavoriteChange: (menu) => {
          latestFavoriteEvent = menu.key;
        },
      },
    });

    expect(controller.canFavorite(tabs[0])).toBe(true);
    expect(controller.isFavorite(tabs[0])).toBe(false);
    expect(controller.handleToggleFavorite('a')).toBe(true);
    expect(controller.isFavorite(tabs[0])).toBe(true);
    expect(latestFavoriteEvent).toBe('a');

    controller.setFavoriteKeys(['a']);
    expect(controller.isFavorite(tabs[0])).toBe(true);
    expect(controller.handleToggleFavorite('missing')).toBe(false);
  });

  it('should sync runtime tabs by path and affix', () => {
    const currentPath = '/system/user';
    let autoMode = true;
    let internalTabs: { key: string; name: string; path: string }[] = [];
    const managedTabs: { key: string; name: string; path: string }[] = [];
    let affixKeys: string[] | undefined = ['home'];

    const controller = createLayoutTabsRuntimeController({
      getCurrentPath: () => currentPath,
      getIsAutoMode: () => autoMode,
      resolveMenuByPath: (path) =>
        path === '/system/user'
          ? { key: 'user', name: '用户', path: '/system/user' }
          : undefined,
      buildTabForMenu: (menu, fullPath) => ({
        key: menu.key,
        name: menu.name,
        path: fullPath,
      }),
      addAutoTab: (tab) => {
        managedTabs.push(tab);
        return [...managedTabs];
      },
      setAutoTabs: (tabs) => {
        internalTabs = tabs;
      },
      getAutoTabs: () => internalTabs,
      getAffixKeys: () => affixKeys,
      setAffixTabs: (keys) => {
        affixKeys = keys;
      },
      getManagedTabs: () => managedTabs,
      getTabs: () => internalTabs,
      getKeepAliveEnabled: () => true,
      getKeepAliveIncludes: () => [],
      setKeepAliveIncludes: () => {},
    });

    expect(controller.syncTabByPath()).toBe(true);
    expect(internalTabs.map((item) => item.key)).toEqual(['user']);
    expect(controller.syncTabByPath()).toBe(false);
    expect(internalTabs.map((item) => item.key)).toEqual(['user']);

    expect(controller.syncAffixTabs()).toBe(false);
    expect(affixKeys).toEqual(['home']);

    autoMode = false;
    expect(controller.syncTabByPath()).toBe(false);
  });

  it('should sync runtime keep-alive includes', () => {
    let keepAliveIncludes: string[] = [];
    const tabs = [
      { key: 'a', name: 'A', path: '/a', cacheName: 'PageA' },
      { key: 'b', name: 'B', path: '/b', cacheName: 'PageB', meta: { keepAlive: false } },
    ];

    const controller = createLayoutTabsRuntimeController({
      getCurrentPath: () => '',
      getIsAutoMode: () => true,
      resolveMenuByPath: () => undefined,
      buildTabForMenu: (_menu, fullPath) => ({
        key: fullPath,
        name: fullPath,
        path: fullPath,
      }),
      addAutoTab: () => tabs,
      setAutoTabs: () => {},
      getAutoTabs: () => tabs,
      getAffixKeys: () => undefined,
      setAffixTabs: () => {},
      getManagedTabs: () => tabs,
      getTabs: () => tabs,
      getKeepAliveEnabled: () => true,
      getKeepAliveIncludes: () => keepAliveIncludes,
      setKeepAliveIncludes: (nextIncludes) => {
        keepAliveIncludes = nextIncludes;
      },
    });

    expect(controller.syncKeepAliveIncludes()).toBe(true);
    expect(keepAliveIncludes).toEqual(['PageA']);
    expect(controller.syncKeepAliveIncludes()).toBe(false);
  });

  it('should bind favorites manager and emit favorites changes', () => {
    let favoriteKeys: string[] = [];
    let latestMenus: string[] = [];

    const managerA = {
      keys: ['a'],
      listener: undefined as ((keys: string[]) => void) | undefined,
      getKeys() {
        return [...this.keys];
      },
      setOnChange(listener?: (keys: string[]) => void) {
        this.listener = listener;
      },
      emit(keys: string[]) {
        this.keys = keys;
        this.listener?.(keys);
      },
    };

    const managerB = {
      keys: ['b'],
      listener: undefined as ((keys: string[]) => void) | undefined,
      getKeys() {
        return [...this.keys];
      },
      setOnChange(listener?: (keys: string[]) => void) {
        this.listener = listener;
      },
      emit(keys: string[]) {
        this.keys = keys;
        this.listener?.(keys);
      },
    };

    const controller = createLayoutFavoritesRuntimeController({
      setFavoriteKeys: (keys) => {
        favoriteKeys = keys;
      },
      resolveFavoriteMenusByKeys: (keys) => keys.map((key) => ({ key, name: key, path: `/${key}` })),
      onFavoritesChange: (menus) => {
        latestMenus = menus.map((item) => item.key);
      },
    });

    controller.bindManager(managerA);
    expect(favoriteKeys).toEqual(['a']);

    managerA.emit(['a', 'c']);
    expect(favoriteKeys).toEqual(['a', 'c']);

    controller.bindManager(managerB, managerA);
    managerA.emit(['x']);
    expect(favoriteKeys).toEqual(['b']);

    controller.emitFavoritesChange(favoriteKeys);
    expect(latestMenus).toEqual(['b']);

    controller.unbindManager(managerB);
    managerB.emit(['z']);
    expect(favoriteKeys).toEqual(['b']);
  });

  it('should sync tab manager options and storage cleanup', () => {
    const updates: Array<{ maxCount?: number; persistKey?: string }> = [];
    let clearCount = 0;
    let tabs = [{ key: 'a', name: 'A', path: '/a' }];
    let syncedTabs: typeof tabs = [];

    const controller = createLayoutTabsManagerRuntimeController({
      updateOptions: (options) => {
        updates.push(options);
      },
      clearStorage: () => {
        clearCount += 1;
      },
      getTabs: () => tabs,
      setTabs: (value) => {
        syncedTabs = value;
      },
    });

    controller.syncTabs();
    expect(syncedTabs).toEqual([{ key: 'a', name: 'A', path: '/a' }]);

    controller.syncOptions({ maxCount: 8, persistKey: 'tabs' });
    controller.syncOptions({ maxCount: 8, persistKey: undefined });
    controller.syncOptions({ maxCount: 8, persistKey: undefined });

    expect(updates).toHaveLength(3);
    expect(clearCount).toBe(1);

    tabs = [{ key: 'b', name: 'B', path: '/b' }];
    controller.syncTabs();
    expect(syncedTabs).toEqual([{ key: 'b', name: 'B', path: '/b' }]);
  });

  it('should orchestrate tabs/favorites sync with scheduler', () => {
    const calls: string[] = [];
    const tasks: Array<() => void> = [];

    const controller = createLayoutTabsSyncController({
      tabsRuntime: {
        syncTabByPath: () => {
          calls.push('tabByPath');
          return true;
        },
        syncAffixTabs: () => {
          calls.push('affix');
          return true;
        },
        syncKeepAliveIncludes: () => {
          calls.push('keepAlive');
          return true;
        },
      },
      favoritesRuntime: {
        emitFavoritesChange: () => {
          calls.push('favorites');
        },
      },
      schedule: (task) => {
        tasks.push(task);
      },
    });

    controller.syncTabByPath();
    controller.syncAffixTabs();
    controller.syncKeepAliveIncludes();
    controller.emitFavoritesChange(['a']);

    expect(calls).toEqual([]);
    tasks.forEach((task) => task());
    expect(calls).toEqual(['tabByPath', 'affix', 'keepAlive', 'favorites']);
  });

  it('should create refresh effects for active tab and keep-alive excludes', () => {
    let refreshKey = 0;
    let excludes: string[] = [];
    const tasks: Array<() => void> = [];

    const controller = createLayoutTabsRefreshEffectsController({
      getKeepAliveEnabled: () => true,
      triggerRefreshKey: () => {
        refreshKey += 1;
      },
      setKeepAliveExcludes: (value) => {
        excludes = value;
      },
      scheduleClearKeepAliveExcludes: (task) => {
        tasks.push(task);
      },
    });

    controller.handleRefreshActive();
    expect(refreshKey).toBe(1);

    controller.handleRefreshTab({
      key: 'a',
      name: 'A',
      path: '/a',
      cacheName: 'PageA',
    });
    expect(excludes).toEqual(['PageA']);
    expect(tasks).toHaveLength(1);
    tasks[0]();
    expect(excludes).toEqual([]);
  });
});
