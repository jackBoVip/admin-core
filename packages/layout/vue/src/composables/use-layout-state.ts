/**
 * 布局状态 Composable
 * @module composables/use-layout-state
 * @description 管理布局的各种状态
 * 
 * 本文件包含以下功能模块：
 * 
 * 1. 区域状态管理 (第 30-230 行)
 *    - useSidebarState: 侧边栏状态
 *    - useHeaderState: 顶栏状态
 *    - useTabbarState: 标签栏状态
 *    - usePanelState: 功能区状态
 *    - useFullscreenState: 全屏状态
 * 
 * 2. 响应式工具 (第 230-320 行)
 *    - useResponsive: 响应式断点
 * 
 * 3. 菜单与导航 (第 320-560 行)
 *    - useMenuState: 菜单状态
 *    - useTabsState: 标签页管理
 *    - useBreadcrumbState: 面包屑状态
 * 
 * 4. 键盘与动画 (第 560-700 行)
 *    - useShortcutKeys: 快捷键
 *    - usePageTransition: 页面过渡
 *    - useDynamicTitle: 动态标题
 * 
 * 5. 路由集成 (第 700-930 行)
 *    - useVueRouterAdapter: Vue Router 适配器
 *    - useRouter: 路由操作
 * 
 * 6. 主题与样式 (第 930-1050 行)
 *    - useTheme: 主题管理
 *    - useWatermark: 水印
 * 
 * 7. 安全与更新 (第 1050-1150 行)
 *    - useLockScreen: 锁屏
 *    - useCheckUpdates: 检查更新
 * 
 * 8. 偏好与用户 (第 1150-1270 行)
 *    - usePreferencesPanel: 偏好设置面板
 *    - useLocale: 国际化
 *    - useUserInfo: 用户信息
 *    - useNotifications: 通知
 * 
 * 9. 其他工具 (第 1270-1400 行)
 *    - useRefresh: 刷新
 *    - useAllCSSVariables: CSS 变量
 *    - useLayoutPreferences: 偏好设置集成
 */

import { 
  BREAKPOINTS, 
  HEADER_TRIGGER_DISTANCE,
  TIMING,
  createAutoLockTimer,
  createCheckUpdatesTimer,
  generateAllCSSVariables,
  generateThemeClasses,
  generateThemeCSSVariables,
  generateWatermarkContent,
  getBreadcrumbNavigationPath,
  getMenuId,
  getMenuPathIndex,
  getNextTabAfterClose,
  getOrCreateTabManager,
  getResolvedLayoutProps,
  mapPreferencesToLayoutProps,
  logger,
  resolveMenuNavigation,
  getTabNavigationPath,
  shouldShowLockScreen,
  type BasicLayoutProps,
  type TabItem,
  type BreadcrumbItem,
  type MenuItem,
  type NotificationItem,
  type ThemeConfig,
  type WatermarkConfig,
  type LockScreenConfig,
} from '@admin-core/layout';
import { getPreferencesManager } from '@admin-core/preferences-vue';
import { computed, isRef, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useLayoutContext, useLayoutComputed } from './use-layout-context';

// ============================================================
// 1. 区域状态管理
// ============================================================

/**
 * 使用侧边栏状态
 */
export function useSidebarState() {
  const context = useLayoutContext();
  const layoutComputed = useLayoutComputed();

  const isNonCollapsible = computed(
    () => layoutComputed.value.isSidebarMixedNav || layoutComputed.value.isHeaderMixedNav
  );

  const collapsed = computed({
    get: () => (isNonCollapsible.value ? false : context.state.sidebarCollapsed),
    set: (value) => {
      if (isNonCollapsible.value) {
        if (context.state.sidebarCollapsed) {
          context.state.sidebarCollapsed = false;
          context.events.onSidebarCollapse?.(false);
        }
        return;
      }
      if (context.state.sidebarCollapsed !== value) {
        context.state.sidebarCollapsed = value;
        context.events.onSidebarCollapse?.(value);
      }
    },
  });

  const expandOnHovering = computed({
    get: () => context.state.sidebarExpandOnHovering,
    set: (value) => {
      if (context.state.sidebarExpandOnHovering !== value) {
        context.state.sidebarExpandOnHovering = value;
      }
    },
  });

  const extraVisible = computed({
    get: () => context.state.sidebarExtraVisible,
    set: (value) => {
      if (context.state.sidebarExtraVisible !== value) {
        context.state.sidebarExtraVisible = value;
      }
    },
  });

  // 子菜单面板是否折叠（vben 的 extraCollapse）
  const extraCollapsed = computed({
    get: () => context.state.sidebarExtraCollapsed ?? false,
    set: (value) => {
      if (context.state.sidebarExtraCollapsed !== value) {
        context.state.sidebarExtraCollapsed = value;
      }
    },
  });

  // 子菜单面板是否固定（vben 的 expandOnHover）
  const expandOnHover = computed({
    get: () => context.state.sidebarExpandOnHover ?? false,
    set: (value) => {
      if (context.state.sidebarExpandOnHover !== value) {
        context.state.sidebarExpandOnHover = value;
      }
    },
  });

  const width = computed(() => layoutComputed.value.sidebarWidth);
  const visible = computed(() => layoutComputed.value.showSidebar);

  const toggle = () => {
    if (isNonCollapsible.value) return;
    collapsed.value = !collapsed.value;
  };

  const handleMouseEnter = () => {
    // 只有当 expandOnHover 为 true 时才展开，否则使用弹出菜单
    if (expandOnHover.value && collapsed.value) {
      expandOnHovering.value = true;
    }
  };

  const handleMouseLeave = () => {
    if (expandOnHovering.value) {
      expandOnHovering.value = false;
    }
    // 悬停展开模式下，鼠标移出时隐藏子菜单面板
    if (expandOnHover.value) {
      extraVisible.value = false;
    }
  };

  return {
    collapsed,
    expandOnHovering,
    extraVisible,
    extraCollapsed,
    expandOnHover,
    width,
    visible,
    layoutComputed,
    toggle,
    handleMouseEnter,
    handleMouseLeave,
  };
}

/**
 * 使用顶栏状态
 */
export function useHeaderState() {
  const context = useLayoutContext();
  const layoutComputed = useLayoutComputed();

  const configHidden = computed(() => context.props.header?.hidden === true);
  const hidden = computed({
    get: () => context.state.headerHidden || configHidden.value,
    set: (value) => {
      if (context.state.headerHidden !== value) {
        context.state.headerHidden = value;
      }
    },
  });

  const height = computed(() => layoutComputed.value.headerHeight);
  const visible = computed(() => layoutComputed.value.showHeader);
  const mode = computed(() => context.props.header?.mode || 'fixed');

  // 自动隐藏逻辑
  let mouseY = 0;
  let lastScrollYWindow = 0;
  let lastScrollYElement = 0;
  let scrollRafWindow: number | null = null;
  let scrollRafElement: number | null = null;
  let mouseMoveRaf: number | null = null;
  let scrollTarget: HTMLElement | null = null;
  let scrollHandlerWindow: (() => void) | null = null;
  let scrollHandlerElement: (() => void) | null = null;
  let mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  const hideThreshold = HEADER_TRIGGER_DISTANCE;
  const showThreshold = Math.max(0, HEADER_TRIGGER_DISTANCE - 20);

  const updateHiddenByMouse = () => {
    if (mouseY > hideThreshold && !hidden.value) {
      hidden.value = true;
      return;
    }
    if (mouseY < showThreshold && hidden.value) {
      hidden.value = false;
    }
  };

  const ensureHandlers = () => {
    if (!mouseMoveHandler) {
      mouseMoveHandler = (e: MouseEvent) => {
        mouseY = e.clientY;
        if (mode.value === 'auto') {
          if (mouseMoveRaf) return;
          mouseMoveRaf = requestAnimationFrame(() => {
            updateHiddenByMouse();
            mouseMoveRaf = null;
          });
        }
      };
    }
    if (!scrollHandlerWindow) {
      scrollHandlerWindow = () => {
        if (scrollRafWindow) return;
        scrollRafWindow = requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const headerMode = mode.value;
          if (headerMode === 'auto') {
            updateHiddenByMouse();
          } else if (headerMode === 'auto-scroll') {
            if (currentScrollY > lastScrollYWindow && currentScrollY > height.value) {
              hidden.value = true;
            } else if (currentScrollY < lastScrollYWindow) {
              hidden.value = false;
            }
          }
          lastScrollYWindow = currentScrollY;
          scrollRafWindow = null;
        });
      };
    }
    if (!scrollHandlerElement) {
      scrollHandlerElement = () => {
        if (!scrollTarget) return;
        if (scrollRafElement) return;
        scrollRafElement = requestAnimationFrame(() => {
          const currentScrollY = scrollTarget?.scrollTop ?? 0;
          const headerMode = mode.value;
          if (headerMode === 'auto') {
            updateHiddenByMouse();
          } else if (headerMode === 'auto-scroll') {
            if (currentScrollY > lastScrollYElement && currentScrollY > height.value) {
              hidden.value = true;
            } else if (currentScrollY < lastScrollYElement) {
              hidden.value = false;
            }
          }
          lastScrollYElement = currentScrollY;
          scrollRafElement = null;
        });
      };
    }
  };

  const removeListeners = () => {
    if (scrollHandlerWindow) {
      window.removeEventListener('scroll', scrollHandlerWindow);
    }
    if (scrollHandlerElement && scrollTarget) {
      scrollTarget.removeEventListener('scroll', scrollHandlerElement);
    }
    if (mouseMoveHandler) {
      window.removeEventListener('mousemove', mouseMoveHandler);
    }
  };

  const updateListeners = () => {
    if (mode.value !== 'auto' && mode.value !== 'auto-scroll') {
      removeListeners();
      hidden.value = false;
      return;
    }
    ensureHandlers();
    removeListeners();
    scrollTarget = typeof document !== 'undefined'
      ? (document.querySelector('.layout-content') as HTMLElement | null)
      : null;
    lastScrollYWindow = typeof window !== 'undefined' ? window.scrollY : 0;
    lastScrollYElement = scrollTarget?.scrollTop ?? 0;

    const currentScrollHandlerWindow = scrollHandlerWindow;
    if (currentScrollHandlerWindow) {
      window.addEventListener('scroll', currentScrollHandlerWindow, { passive: true });
    }
    const currentScrollHandlerElement = scrollHandlerElement;
    if (currentScrollHandlerElement && scrollTarget) {
      scrollTarget.addEventListener('scroll', currentScrollHandlerElement, { passive: true });
    }
    if (mode.value === 'auto') {
      const currentMouseMoveHandler = mouseMoveHandler;
      if (currentMouseMoveHandler) {
        window.addEventListener('mousemove', currentMouseMoveHandler, { passive: true });
      }
    }
  };

  onMounted(updateListeners);

  watch(mode, () => {
    if (typeof window === 'undefined') return;
    updateListeners();
  }, { immediate: true });

  onUnmounted(() => {
    removeListeners();
    if (scrollRafWindow !== null) {
      cancelAnimationFrame(scrollRafWindow);
    }
    if (scrollRafElement !== null) {
      cancelAnimationFrame(scrollRafElement);
    }
    if (mouseMoveRaf !== null) {
      cancelAnimationFrame(mouseMoveRaf);
    }
  });

  return {
    hidden,
    height,
    visible,
    mode,
  };
}

/**
 * 使用标签栏状态
 */
export function useTabbarState() {
  const layoutComputed = useLayoutComputed();

  const height = computed(() => layoutComputed.value.tabbarHeight);
  const visible = computed(() => layoutComputed.value.showTabbar);

  return {
    height,
    visible,
  };
}

/**
 * 使用功能区状态
 */
export function usePanelState() {
  const context = useLayoutContext();
  const layoutComputed = useLayoutComputed();

  const collapsed = computed({
    get: () => context.state.panelCollapsed,
    set: (value) => {
      if (context.state.panelCollapsed !== value) {
        context.state.panelCollapsed = value;
        context.events.onPanelCollapse?.(value);
      }
    },
  });

  const width = computed(() => layoutComputed.value.panelWidth);
  const visible = computed(() => layoutComputed.value.showPanel);
  const position = computed(() => context.props.panel?.position || 'right');

  const toggle = () => {
    collapsed.value = !collapsed.value;
  };

  return {
    collapsed,
    width,
    visible,
    position,
    toggle,
  };
}

/**
 * 使用全屏状态
 */
export function useFullscreenState() {
  const context = useLayoutContext();
  const isFullscreen = ref(false);

  const toggle = async () => {
    try {
      const nextValue = !document.fullscreenElement;
      if (nextValue) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
      if (isFullscreen.value !== nextValue) {
        isFullscreen.value = nextValue;
      }
      if (context.state.isFullscreen !== nextValue) {
        context.state.isFullscreen = nextValue;
      }
      context.events.onFullscreenToggle?.(nextValue);
    } catch (error) {
      logger.error('Fullscreen error:', error);
    }
  };

  const handleFullscreenChange = () => {
    const nextValue = !!document.fullscreenElement;
    if (isFullscreen.value !== nextValue) {
      isFullscreen.value = nextValue;
    }
    if (context.state.isFullscreen !== nextValue) {
      context.state.isFullscreen = nextValue;
    }
  };

  onMounted(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
  });

  onUnmounted(() => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
  });

  return {
    isFullscreen,
    toggle,
  };
}

/**
 * 使用响应式断点
 * 优化：使用 window.resize 事件 + 节流，避免 ResizeObserver 监听整个文档的性能开销
 */
export function useResponsive() {
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : TIMING.defaultWindowWidth);

  const isMobile = computed(() => width.value < BREAKPOINTS.md);
  const isTablet = computed(() => width.value >= BREAKPOINTS.md && width.value < BREAKPOINTS.lg);
  const isDesktop = computed(() => width.value >= BREAKPOINTS.lg);

  const breakpoint = computed(() => {
    if (width.value < BREAKPOINTS.sm) return 'xs';
    if (width.value < BREAKPOINTS.md) return 'sm';
    if (width.value < BREAKPOINTS.lg) return 'md';
    if (width.value < BREAKPOINTS.xl) return 'lg';
    if (width.value < BREAKPOINTS['2xl']) return 'xl';
    return '2xl';
  });

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let resizeHandler: (() => void) | null = null;

  onMounted(() => {
    if (typeof window === 'undefined') return;
    
    // 节流处理 resize 事件
    resizeHandler = () => {
      if (timeoutId) return;
      
      timeoutId = setTimeout(() => {
        const nextWidth = window.innerWidth;
        if (nextWidth !== width.value) {
          width.value = nextWidth;
        }
        timeoutId = null;
      }, TIMING.throttle);
    };

    window.addEventListener('resize', resizeHandler, { passive: true });
  });

  onUnmounted(() => {
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });

  return {
    width,
    isMobile,
    isTablet,
    isDesktop,
    breakpoint,
  };
}

/**
 * 使用菜单状态
 */
export function useMenuState() {
  const context = useLayoutContext();
  const { currentPath, handleMenuItemClick } = useRouter();
  const normalizeKey = (value: unknown) => (value == null || value === '' ? '' : String(value));

  const openKeys = computed({
    get: () => context.state.openMenuKeys,
    set: (value) => {
      context.setOpenMenuKeys(value);
    },
  });

  const menuPath = computed(() => currentPath.value.split('?')[0] || '');
  const activeKey = computed<string>(() => {
    const candidate = context.props.activeMenuKey ?? menuPath.value ?? '';
    return normalizeKey(candidate);
  });
  const menus = computed<MenuItem[]>(() => context.props.menus || []);
  const menuIndex = computed(() => getMenuPathIndex(context.props.menus || []));

  // 根据当前路径自动展开菜单
  watch(
    [menuPath, menuIndex],
    ([path]) => {
      if (!path) return;
      const index = menuIndex.value;
      const menu = index.byPath.get(path) ?? index.byKey.get(path);
      if (menu) {
        // 获取菜单路径，自动展开父级
        const chain =
          index.chainByPath.get(path) ??
          (menu.key ? index.chainByKey.get(menu.key) : undefined) ??
          [];
        if (chain.length > 1) {
          const parentKeys = chain.slice(0, -1);
          if (context.props.navigation?.accordion) {
            const lastParentKey = parentKeys[parentKeys.length - 1];
            if (lastParentKey !== undefined) {
              openKeys.value = [lastParentKey];
            }
          } else {
            const merged = [...new Set([...openKeys.value, ...parentKeys])];
            if (merged.length !== openKeys.value.length) {
              openKeys.value = merged;
            } else {
              let same = true;
              for (let i = 0; i < merged.length; i += 1) {
                if (merged[i] !== openKeys.value[i]) {
                  same = false;
                  break;
                }
              }
              if (!same) {
                openKeys.value = merged;
              }
            }
          }
        }
      }
    },
    { immediate: true }
  );

  // 选择菜单（内置路由跳转）
  const handleSelect = (key: string) => {
    const target = normalizeKey(key);
    if (!target) return;
    const item = menuIndex.value.byKey.get(target) ?? menuIndex.value.byPath.get(target);
    if (item) {
      // 内置路由跳转
      handleMenuItemClick(item);
      // 触发外部事件（可选）
      context.events.onMenuSelect?.(item, target);
    }
  };

  const handleOpenChange = (keys: string[]) => {
    if (context.props.navigation?.accordion) {
      // 手风琴模式：保留当前分支的父级路径
      const lastKey = keys[keys.length - 1];
      let nextKeys: string[] = [];
      if (lastKey !== undefined) {
        const menu = menuIndex.value.byKey.get(lastKey) ?? menuIndex.value.byPath.get(lastKey);
        const chain =
          (menu?.key ? menuIndex.value.chainByKey.get(menu.key) : undefined) ??
          (menu?.path ? menuIndex.value.chainByPath.get(menu.path) : undefined) ??
          [];
        nextKeys = chain.length > 0 ? chain : [lastKey];
      }
      if (nextKeys.length !== openKeys.value.length || nextKeys[0] !== openKeys.value[0]) {
        openKeys.value = nextKeys;
      }
    } else {
      if (keys.length !== openKeys.value.length) {
        openKeys.value = keys;
        return;
      }
      let same = true;
      for (let i = 0; i < keys.length; i += 1) {
        if (keys[i] !== openKeys.value[i]) {
          same = false;
          break;
        }
      }
      if (!same) {
        openKeys.value = keys;
      }
    }
  };

  return {
    openKeys,
    activeKey,
    menus,
    handleSelect,
    handleOpenChange,
  };
}

// 使用 core 的 TabManager 缓存管理

/**
 * 使用标签状态（支持自动模式）
 */
export function useTabsState() {
  const context = useLayoutContext();
  const { currentPath, handleTabClick, handleTabCloseNavigate } = useRouter();

  // 内部标签状态（自动模式使用）
  const internalTabs = ref<TabItem[]>([]);

  // 是否启用自动模式
  const isAutoMode = computed(() => context.props.autoTab?.enabled !== false);

  // 标签栏配置
  const tabbarConfig = computed(() => context.props.tabbar || {});
  const maxCount = computed(() => {
    if (tabbarConfig.value.maxCount !== undefined && tabbarConfig.value.maxCount !== null) {
      return tabbarConfig.value.maxCount;
    }
    return context.props.autoTab?.maxCount ?? 0;
  });
  const persistKey = computed(() => {
    if (tabbarConfig.value.persist === false) return undefined;
    return context.props.autoTab?.persistKey || 'tabs';
  });

  // 标签管理器（使用 core 缓存实例）
  const tabManager = getOrCreateTabManager({
    maxCount: maxCount.value,
    affixTabs: context.props.autoTab?.affixKeys,
    persistKey: persistKey.value,
    onChange: (tabs) => {
      internalTabs.value = tabs;
    },
  });

  // 初始化标签
  internalTabs.value = tabManager.getTabs();

  // 监听配置变化
  watch([maxCount, persistKey], ([nextMax, nextPersist], [, prevPersist]) => {
    tabManager.updateOptions({
      maxCount: nextMax,
      persistKey: nextPersist,
    });
    if (!nextPersist && prevPersist) {
      tabManager.clearStorage();
    }
  });

  const normalizePath = (path: string) => path.split('?')[0] || path;
  const getPageKey = (fullPath: string) => {
    if (!fullPath.includes('?')) return '';
    const query = fullPath.split('?')[1]?.split('#')[0] || '';
    if (!query) return '';
    try {
      const params = new URLSearchParams(query);
      return params.get('pageKey') || '';
    } catch {
      return '';
    }
  };
  const resolveTabKey = (fullPath: string, menu?: MenuItem) => {
    const basePath = normalizePath(fullPath);
    const meta = menu?.meta as Record<string, unknown> | undefined;
    const fullPathKey = meta?.fullPathKey;
    const pageKey = getPageKey(fullPath);
    const rawKey =
      pageKey || (fullPathKey === false ? basePath : fullPath || basePath);
    const fallbackKey = menu?.key || basePath;
    try {
      return decodeURIComponent(rawKey) || fallbackKey;
    } catch {
      return rawKey || fallbackKey;
    }
  };

  // 实际标签数据
  const tabs = computed(() => {
    if (isAutoMode.value) {
      return internalTabs.value;
    }
    return context.props.tabs || [];
  });

  const tabMap = computed(() => {
    const map = new Map<string, TabItem>();
    for (const tab of tabs.value) {
      map.set(tab.key, tab);
    }
    return map;
  });
  const menuIndex = computed(() => getMenuPathIndex(context.props.menus || []));

  const resolveMenuByPath = (path: string) => {
    const basePath = normalizePath(path);
    const index = menuIndex.value;
    let menu =
      index.byPath.get(basePath) ??
      index.byKey.get(basePath);
    if (!menu) {
      for (const item of index.pathItems) {
        if (item.path && basePath.startsWith(item.path)) {
          menu = item;
          break;
        }
      }
    }
    return menu;
  };

  const activeKey = computed<string>(() => {
    if (context.props.activeTabKey) return context.props.activeTabKey;
    const path = currentPath.value || '';
    if (!isAutoMode.value || !path) return path;
    const menu = resolveMenuByPath(path);
    if (!menu) return path;
    return resolveTabKey(path, menu);
  });

  const buildTabFromMenu = (menu: MenuItem, fullPath: string): TabItem => {
    const resolvedFullPath = fullPath || menu.path || '';
    const basePath = normalizePath(resolvedFullPath || menu.path || '');
    const key = resolveTabKey(resolvedFullPath || basePath, menu);
    const baseTab = tabManager.createTabFromMenu(menu, { affix: menu.affix });
    return {
      ...baseTab,
      key,
      path: resolvedFullPath || baseTab.path || basePath,
      meta: {
        ...(baseTab.meta || {}),
        fullPath: resolvedFullPath || basePath,
        fullPathKey: (menu.meta as Record<string, unknown> | undefined)?.fullPathKey,
        pageKey: getPageKey(resolvedFullPath || basePath) || undefined,
      },
    };
  };

  // 监听当前路径变化，自动添加标签
  watch(
    [currentPath, menuIndex],
    ([path]) => {
      if (!isAutoMode.value || !path) return;

      const menu = resolveMenuByPath(path);

      // 检查菜单是否配置了隐藏标签
      if (menu && menu.path && !menu.hideInTab) {
        const tab = buildTabFromMenu(menu, path);
        internalTabs.value = tabManager.addTab(tab);
      }
    },
    { immediate: true }
  );

  // 监听固定标签配置变化
  watch(
    () => context.props.autoTab?.affixKeys,
    (keys) => {
      if (keys) {
        tabManager.setAffixTabs(keys);
        internalTabs.value = tabManager.getTabs();
      }
    }
  );

  // keep-alive include 列表
  watch(
    [tabs, () => tabbarConfig.value.keepAlive],
    ([nextTabs, keepAliveEnabled]) => {
      if (keepAliveEnabled === false) {
        context.state.keepAliveIncludes = [];
        return;
      }
      const includes = nextTabs
        .filter((tab) => (tab.meta as Record<string, unknown> | undefined)?.keepAlive !== false)
        .map((tab) => {
          return (
            tab.cacheName ||
            ((tab.meta as Record<string, unknown> | undefined)?.cacheName as string | undefined) ||
            tab.name
          );
        })
        .filter(Boolean);
      context.state.keepAliveIncludes = includes;
    },
    { immediate: true }
  );

  // 选择标签（内置路由跳转）
  const handleSelect = (key: string) => {
    const item = tabMap.value.get(key);
    if (item) {
      // 内置路由跳转
      handleTabClick(item);
      // 触发外部事件（可选）
      context.events.onTabSelect?.(item, key);
    }
  };

  // 关闭标签（内置导航处理）
  const handleClose = (key: string) => {
    const item = tabMap.value.get(key);
    if (item && item.closable !== false) {
      const beforeTabs = tabs.value;
      if (isAutoMode.value) {
        internalTabs.value = tabManager.removeTab(key);
      }
      
      // 内置导航处理（关闭当前标签时跳转）
      handleTabCloseNavigate(key, beforeTabs, activeKey.value);
      
      // 触发外部事件
      context.events.onTabClose?.(item, key);
    }
  };

  const handleCloseAll = () => {
    if (isAutoMode.value) {
      internalTabs.value = tabManager.removeAllTabs();
      // 跳转到第一个固定标签
      const firstTab = internalTabs.value[0];
      if (firstTab) {
        handleTabClick(firstTab);
      }
    }
    context.events.onTabCloseAll?.();
  };

  const handleCloseOther = (key: string) => {
    if (isAutoMode.value) {
      internalTabs.value = tabManager.removeOtherTabs(key);
    }
    context.events.onTabCloseOther?.(key);
  };

  const handleCloseLeft = (key: string) => {
    if (isAutoMode.value) {
      internalTabs.value = tabManager.removeLeftTabs(key);
    }
  };

  const handleCloseRight = (key: string) => {
    if (isAutoMode.value) {
      internalTabs.value = tabManager.removeRightTabs(key);
    }
  };

  const handleRefresh = (key: string) => {
    const item = tabMap.value.get(key);
    if (key === activeKey.value) {
      context.state.refreshKey += 1;
    }
    if (tabbarConfig.value.keepAlive !== false && item) {
      const meta = item.meta as Record<string, unknown> | undefined;
      const cacheName = item.cacheName || (meta?.cacheName as string | undefined) || item.name;
      if (cacheName) {
        context.state.keepAliveExcludes = [cacheName];
        nextTick(() => {
          context.state.keepAliveExcludes = [];
        });
      }
    }
    if (item) {
      context.events.onTabRefresh?.(item, key);
    }
  };

  const handleToggleAffix = (key: string) => {
    if (isAutoMode.value) {
      internalTabs.value = tabManager.toggleAffix(key);
    }
  };

  const handleOpenInNewWindow = (key: string) => {
    const item = tabMap.value.get(key);
    if (!item) return;
    const meta = item.meta as Record<string, unknown> | undefined;
    const url =
      (meta?.externalLink as string | undefined) ||
      (meta?.fullPath as string | undefined) ||
      item.path;
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleSort = (fromIndex: number, toIndex: number) => {
    if (isAutoMode.value) {
      internalTabs.value = tabManager.sortTabs(fromIndex, toIndex);
    }
  };

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
    handleSort,
    // 暴露 tabManager 供高级用法
    tabManager,
  };
}

/**
 * 使用面包屑状态（支持自动模式）
 */
export function useBreadcrumbState() {
  const context = useLayoutContext();
  const { currentPath, handleBreadcrumbClick: navigateBreadcrumb } = useRouter();

  // 是否启用自动模式
  const isAutoMode = computed(() => context.props.autoBreadcrumb?.enabled !== false);

  // 面包屑配置
  const breadcrumbConfig = computed(() => context.props.breadcrumb || {});
  const menuIndex = computed(() => getMenuPathIndex(context.props.menus || []));

  // 面包屑数据
  const breadcrumbs = computed(() => {
    if (!isAutoMode.value) {
      return context.props.breadcrumbs || [];
    }

    const path = currentPath.value;
    const basePath = path.split('?')[0] || path;
    const config = context.props.autoBreadcrumb || {};

    if (!path || menuIndex.value.byKey.size === 0) {
      return [];
    }

    // 翻译首页名称
    const translatedHomeName = context.t('layout.breadcrumb.home');

    const showHome = config.showHome ?? breadcrumbConfig.value.showHome ?? true;
    const homePath = config.homePath || context.props.defaultHomePath || '/';
    const hideOnlyOne = breadcrumbConfig.value.hideOnlyOne ?? true;
    const homeName = config.homeName || translatedHomeName;
    const homeIcon = config.homeIcon || 'home';

    const index = menuIndex.value;
    let menu =
      index.byPath.get(basePath) ??
      index.byKey.get(basePath);
    if (!menu) {
      for (const item of index.pathItems) {
        if (item.path && basePath.startsWith(item.path)) {
          menu = item;
          break;
        }
      }
    }
    const chainKeys =
      (menu?.key ? index.chainByKey.get(menu.key) : undefined) ??
      (menu?.path ? index.chainByPath.get(menu.path) : undefined) ??
      [];

    const items: BreadcrumbItem[] = [];
    if (showHome) {
      items.push({
        key: '__breadcrumb_home__',
        name: homeName,
        icon: homeIcon,
        path: homePath,
        clickable: true,
      });
    }

    for (const key of chainKeys) {
      const menuItem = index.byKey.get(key) ?? index.byPath.get(key);
      if (!menuItem) continue;
      if (showHome && menuItem.path === homePath) continue;
      const menuId = getMenuId(menuItem);
      items.push({
        key: `__breadcrumb_${menuId}__`,
        name: menuItem.name,
        icon: menuItem.icon,
        path: menuItem.path,
        clickable: !!menuItem.path && menuItem.path !== basePath,
      });
    }

    if (hideOnlyOne && items.length <= 1) {
      return [];
    }
    return items;
  });

  // 是否显示图标
  const showIcon = computed(() => breadcrumbConfig.value.showIcon !== false);

  // 面包屑样式
  const styleType = computed(() => breadcrumbConfig.value.styleType || 'normal');

  // 点击面包屑（内置路由跳转）
  const handleClick = (item: BreadcrumbItem) => {
    if (item.clickable && item.path) {
      // 内置路由跳转
      navigateBreadcrumb(item);
      // 触发外部事件（可选）
      context.events.onBreadcrumbClick?.(item, item.key);
    }
  };

  return {
    breadcrumbs,
    isAutoMode,
    showIcon,
    styleType,
    handleClick,
  };
}


/**
 * 使用快捷键
 */
export function useShortcutKeys() {
  const context = useLayoutContext();

  const config = computed(() => context.props.shortcutKeys || {});
  const enabled = computed(() => config.value.enable !== false);

  // 快捷键处理函数
  const handleKeydown = (e: KeyboardEvent) => {
    if (!enabled.value) return;

    const { key, altKey, ctrlKey, metaKey } = e;
    const modKey = ctrlKey || metaKey;

    // Alt+L 锁屏
    if (altKey && key.toLowerCase() === 'l' && config.value.globalLockScreen !== false) {
      e.preventDefault();
      context.events.onLockScreen?.();
    }

    // Alt+Q 登出
    if (altKey && key.toLowerCase() === 'q' && config.value.globalLogout !== false) {
      e.preventDefault();
      context.events.onLogout?.();
    }

    // Ctrl/Cmd+K 全局搜索
    if (modKey && key.toLowerCase() === 'k' && config.value.globalSearch !== false) {
      e.preventDefault();
      context.events.onGlobalSearch?.('');
    }

    // Ctrl/Cmd+, 偏好设置
    if (modKey && key === ',' && config.value.globalPreferences !== false) {
      e.preventDefault();
      // 触发偏好设置打开事件（可通过插槽实现）
    }
  };

  // 使用 watch 统一管理监听器，避免重复添加
  let isListening = false;

  const addListener = () => {
    if (!isListening) {
      window.addEventListener('keydown', handleKeydown);
      isListening = true;
    }
  };

  const removeListener = () => {
    if (isListening) {
      window.removeEventListener('keydown', handleKeydown);
      isListening = false;
    }
  };

  onMounted(() => {
    if (enabled.value) {
      addListener();
    }
  });

  onUnmounted(() => {
    removeListener();
  });

  // 监听配置变化
  watch(enabled, (val) => {
    if (val) {
      addListener();
    } else {
      removeListener();
    }
  });

  return {
    enabled,
    config,
  };
}

/**
 * 使用页面过渡动画
 */
export function usePageTransition() {
  const context = useLayoutContext();

  const config = computed(() => context.props.transition || {});
  const enabled = computed(() => config.value.enable !== false);
  const transitionName = computed(() => config.value.name || 'fade-slide');
  const showProgress = computed(() => config.value.progress !== false);
  const showLoading = computed(() => config.value.loading !== false);

  return {
    enabled,
    transitionName,
    showProgress,
    showLoading,
    config,
  };
}

/**
 * 使用动态标题
 */
export function useDynamicTitle() {
  const context = useLayoutContext();

  const enabled = computed(() => context.props.dynamicTitle !== false);
  const appName = computed(() => context.props.appName || '');
  const menuIndex = computed(() => getMenuPathIndex(context.props.menus || []));

  // 更新标题
  const updateTitle = (pageTitle?: string) => {
    if (!enabled.value || typeof document === 'undefined') return;

    if (pageTitle && appName.value) {
      document.title = `${pageTitle} - ${appName.value}`;
    } else if (pageTitle) {
      document.title = pageTitle;
    } else if (appName.value) {
      document.title = appName.value;
    }
  };

  // 监听当前路径变化，自动更新标题
  watch(
    [() => context.props.currentPath, menuIndex],
    ([path]) => {
      if (!enabled.value || !path) return;

      const basePath = String(path).split('?')[0] || String(path);
      const index = menuIndex.value;
      let menu =
        index.byPath.get(basePath) ??
        index.byKey.get(basePath);
      if (!menu) {
        for (const item of index.pathItems) {
          if (item.path && basePath.startsWith(item.path)) {
            menu = item;
            break;
          }
        }
      }

      if (menu) {
        updateTitle(menu.name);
      }
    },
    { immediate: true }
  );

  return {
    enabled,
    appName,
    updateTitle,
  };
}

/**
 * 创建 Vue Router 适配器
 * @description 在 setup 中调用，自动获取 vue-router 实例
 * @example
 * // 方式1：自动检测（需要在 vue-router 环境下）
 * const router = useVueRouterAdapter();
 * 
 * // 方式2：手动传入
 * import { useRouter, useRoute } from 'vue-router';
 * const router = useVueRouterAdapter(useRouter(), useRoute());
 */
/** Vue Router 实例类型（简化版） */
interface VueRouterInstance {
  push: (to: string | Record<string, unknown>) => void | Promise<unknown>;
}

export function useVueRouterAdapter(
  routerInstance?: VueRouterInstance,
  routeInstance?: { path: string; fullPath?: string }
) {
  // 尝试自动获取 vue-router
  const router = ref(routerInstance);
  const route = ref(routeInstance);

  if (!router.value || !route.value) {
    onMounted(async () => {
      try {
        const dynamicImport = new Function('m', 'return import(m)') as (m: string) => Promise<unknown>;
        const vueRouter = await dynamicImport('vue-router') as Record<string, unknown>;
        if (!router.value && typeof vueRouter.useRouter === 'function') {
          router.value = (vueRouter.useRouter as () => typeof routerInstance)();
        }
        if (!route.value && typeof vueRouter.useRoute === 'function') {
          route.value = (vueRouter.useRoute as () => typeof routeInstance)();
        }
      } catch {
        // vue-router 未安装，这是正常的可选依赖场景
      }
    });
  }

  return {
    navigate: (path: string, options?: { replace?: boolean; query?: Record<string, unknown> }) => {
      if (!router.value) return;
      const [rawPath, rawQuery] = path.split('?');
      const query = options?.query ?? (() => {
        if (!rawQuery) return undefined;
        try {
          const params = new URLSearchParams(rawQuery.split('#')[0]);
          return Object.fromEntries(params.entries());
        } catch {
          return undefined;
        }
      })();
      router.value.push({
        path: rawPath,
        query,
        replace: options?.replace,
      });
    },
    currentPath: computed(() => route.value?.fullPath || route.value?.path || ''),
  };
}

/**
 * 使用内置路由
 * @description 自动处理菜单、标签、面包屑的路由跳转
 */
export function useRouter() {
  const context = useLayoutContext();

  const normalizePath = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && 'value' in value) {
      const resolved = (value as { value?: unknown }).value;
      return typeof resolved === 'string' ? resolved : '';
    }
    return '';
  };

  // 获取当前路径（优先使用 router.currentPath）
  const currentPath = computed<string>(() => {
    const router = context.props.router;
    if (!router) {
      return normalizePath(context.props.currentPath) || '';
    }
    
    const routerPath = router.currentPath;
    // 支持 ComputedRef、Ref 和普通值
    // 使用 isRef 进行更准确的类型判断
    if (isRef(routerPath)) {
      return normalizePath(routerPath.value);
    }
    return normalizePath(routerPath) || normalizePath(context.props.currentPath);
  });

  // 路由导航函数
  const navigate = (
    path: string,
    options?: {
      replace?: boolean;
      params?: Record<string, string | number>;
      query?: Record<string, string | number>;
    }
  ) => {
    if (context.props.router?.navigate) {
      context.props.router.navigate(path, options);
    }
  };

  // 处理菜单项点击
  const handleMenuItemClick = (menu: MenuItem) => {
    const action = resolveMenuNavigation(menu, {
      autoActivateChild: context.props.sidebar?.autoActivateChild,
    });

    if (action.type === 'external' && action.url) {
      window.open(action.url, action.target ?? '_blank');
      return;
    }

    if (action.type === 'internal' && action.path) {
      navigate(action.path, {
        params: action.params,
        query: action.query,
      });
    }
  };

  // 处理标签点击
  const handleTabClick = (tab: TabItem) => {
    const targetPath = getTabNavigationPath(tab, currentPath.value);
    if (targetPath) {
      navigate(targetPath);
    }
  };

  // 处理面包屑点击
  const handleBreadcrumbClick = (item: BreadcrumbItem) => {
    const targetPath = getBreadcrumbNavigationPath(item, currentPath.value);
    if (targetPath) {
      navigate(targetPath);
    }
  };

  // 关闭标签后的导航处理
  const handleTabCloseNavigate = (
    closedKey: string,
    tabs: TabItem[],
    activeKey: string
  ) => {
    const nextTab = getNextTabAfterClose(tabs, closedKey, activeKey);
    if (nextTab?.path) {
      navigate(nextTab.path);
    }
  };

  return {
    currentPath,
    navigate,
    handleMenuItemClick,
    handleTabClick,
    handleBreadcrumbClick,
    handleTabCloseNavigate,
  };
}

/**
 * 使用主题
 */
export function useTheme() {
  const context = useLayoutContext();

  const config = computed<ThemeConfig>(() => context.props.theme || {});
  const mode = computed(() => config.value.mode || 'light');
  const isDark = computed(() => mode.value === 'dark');
  const isAuto = computed(() => mode.value === 'auto');

  // 系统主题检测
  const systemDark = ref(
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
  );

  // 实际主题模式
  const actualMode = computed(() => {
    if (isAuto.value) {
      return systemDark.value ? 'dark' : 'light';
    }
    return mode.value;
  });

  // CSS 变量
  const cssVariables = computed(() => generateThemeCSSVariables({
    ...config.value,
    mode: actualMode.value,
  }));

  // CSS 类名
  const cssClasses = computed(() => generateThemeClasses({
    ...config.value,
    mode: actualMode.value,
  }));

  // 灰色模式
  const isGrayMode = computed(() => config.value.colorGrayMode === true);

  // 色弱模式
  const isWeakMode = computed(() => config.value.colorWeakMode === true);

  // 监听系统主题变化
  let mediaQuery: MediaQueryList | null = null;
  let themeHandler: ((e: MediaQueryListEvent) => void) | null = null;

  onMounted(() => {
    if (typeof window !== 'undefined' && isAuto.value) {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      themeHandler = (e: MediaQueryListEvent) => {
        systemDark.value = e.matches;
      };
      mediaQuery.addEventListener('change', themeHandler);
    }
  });

  onUnmounted(() => {
    if (mediaQuery && themeHandler) {
      mediaQuery.removeEventListener('change', themeHandler);
    }
  });

  // 切换主题
  const toggleTheme = () => {
    context.events.onThemeToggle?.(isDark.value ? 'light' : 'dark');
  };

  return {
    config,
    mode,
    isDark,
    isAuto,
    actualMode,
    cssVariables,
    cssClasses,
    isGrayMode,
    isWeakMode,
    systemDark,
    toggleTheme,
  };
}

/**
 * 使用水印
 */
export function useWatermark() {
  const context = useLayoutContext();

  const config = computed<WatermarkConfig>(() => context.props.watermark || {});
  const enabled = computed(() => config.value.enable === true);
  const content = computed(() => generateWatermarkContent(config.value));

  // 水印样式
  const style = computed(() => {
    if (!enabled.value) {
      return { display: 'none' };
    }

    return {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none' as const,
      zIndex: config.value.zIndex || 9999,
      opacity: config.value.opacity || 1,
    };
  });

  // 水印画布配置
  const canvasConfig = computed(() => ({
    content: content.value,
    fontSize: config.value.fontSize || 16,
    fontColor: config.value.fontColor || 'rgba(0, 0, 0, 0.15)',
    angle: config.value.angle || -22,
    gap: config.value.gap || [100, 100],
    offset: config.value.offset || [50, 50],
  }));

  return {
    enabled,
    content,
    style,
    config,
    canvasConfig,
  };
}

/**
 * 使用锁屏
 */
export function useLockScreen() {
  const context = useLayoutContext();

  const config = computed<LockScreenConfig>(() => context.props.lockScreen || {});
  const isLocked = computed(() => shouldShowLockScreen(config.value));
  const backgroundImage = computed(() => config.value.backgroundImage || '');
  const showUserInfo = computed(() => config.value.showUserInfo !== false);
  const showClock = computed(() => config.value.showClock !== false);
  const showDate = computed(() => config.value.showDate !== false);

  // 自动锁屏定时器
  let cleanupTimer: (() => void) | null = null;

  const lock = () => {
    context.events.onLockScreen?.();
  };

  const unlock = (_password?: string) => {
    // 验证密码逻辑由外部处理
    // 这里只触发事件
  };

  // 启动自动锁屏
  onMounted(() => {
    if (config.value.autoLockTime && config.value.autoLockTime > 0) {
      cleanupTimer = createAutoLockTimer(config.value, lock);
    }
  });

  // 监听配置变化
  watch(
    () => config.value.autoLockTime,
    (time) => {
      if (cleanupTimer) {
        cleanupTimer();
        cleanupTimer = null;
      }
      if (time && time > 0) {
        cleanupTimer = createAutoLockTimer(config.value, lock);
      }
    }
  );

  onUnmounted(() => {
    if (cleanupTimer) {
      cleanupTimer();
    }
  });

  return {
    isLocked,
    backgroundImage,
    showUserInfo,
    showClock,
    showDate,
    config,
    lock,
    unlock,
  };
}

/**
 * 使用检查更新
 */
export function useCheckUpdates(checkFn?: () => Promise<boolean>) {
  const context = useLayoutContext();

  const config = computed(() => context.props.checkUpdates || {});
  const enabled = computed(() => config.value.enable === true);
  const hasUpdate = ref(false);

  let cleanupTimer: (() => void) | null = null;

  const handleUpdate = (result: boolean) => {
    hasUpdate.value = result;
  };

  onMounted(() => {
    if (enabled.value && checkFn) {
      cleanupTimer = createCheckUpdatesTimer(
        config.value,
        handleUpdate,
        checkFn
      );
    }
  });

  onUnmounted(() => {
    if (cleanupTimer) {
      cleanupTimer();
    }
  });

  return {
    enabled,
    hasUpdate,
    config,
  };
}

/**
 * 使用偏好设置面板
 */
export function usePreferencesPanel() {
  const context = useLayoutContext();

  const enabled = computed(() => context.props.enablePreferences !== false);
  const position = computed(() => context.props.preferencesButtonPosition || 'auto');
  const stickyNav = computed(() => context.props.enableStickyPreferencesNav !== false);

  const isOpen = ref(false);

  const open = () => {
    if (enabled.value) {
      isOpen.value = true;
    }
  };

  const close = () => {
    isOpen.value = false;
  };

  const toggle = () => {
    if (enabled.value) {
      isOpen.value = !isOpen.value;
    }
  };

  return {
    enabled,
    position,
    stickyNav,
    isOpen,
    open,
    close,
    toggle,
  };
}

/**
 * 使用语言切换
 */
export function useLocale() {
  const context = useLayoutContext();

  const locale = computed(() => context.props.locale || 'zh-CN');

  const changeLocale = (newLocale: string) => {
    context.events.onLocaleChange?.(newLocale);
  };

  return {
    locale,
    changeLocale,
  };
}

/**
 * 使用用户信息
 */
export function useUserInfo() {
  const context = useLayoutContext();

  const userInfo = computed(() => context.props.userInfo);
  const avatar = computed(() => 
    userInfo.value?.avatar || context.props.defaultAvatar || ''
  );
  const displayName = computed(() => 
    userInfo.value?.displayName || userInfo.value?.username || ''
  );
  const roles = computed(() => userInfo.value?.roles || []);

  const handleMenuSelect = (key: string) => {
    context.events.onUserMenuSelect?.(key);
  };

  const handleLogout = () => {
    context.events.onLogout?.();
  };

  return {
    userInfo,
    avatar,
    displayName,
    roles,
    handleMenuSelect,
    handleLogout,
  };
}

/**
 * 使用通知
 */
export function useNotifications() {
  const context = useLayoutContext();

  const notifications = computed(() => context.props.notifications || []);
  const unreadCount = computed(() => context.props.unreadCount || 0);
  const hasUnread = computed(() => unreadCount.value > 0);

  const handleClick = (item: NotificationItem) => {
    context.events.onNotificationClick?.(item);
  };

  return {
    notifications,
    unreadCount,
    hasUnread,
    handleClick,
  };
}

/**
 * 使用刷新
 * @description 刷新当前标签页（如果有），否则触发通用刷新事件
 */
export function useRefresh() {
  const context = useLayoutContext();
  const { currentPath } = useRouter();

  const isRefreshing = ref(false);
  let refreshTimer: ReturnType<typeof setTimeout> | null = null;

  // 从 context.props 获取标签和活动标签
  const tabs = computed(() => context.props.tabs || []);
  const activeKey = computed(() => context.props.activeTabKey || currentPath.value || '');
  const activeTab = computed(() => {
    if (!activeKey.value) return undefined;
    return tabs.value.find((tab) => tab.key === activeKey.value);
  });

  const refresh = async () => {
    if (isRefreshing.value) return;

    isRefreshing.value = true;
    try {
      context.state.refreshKey += 1;
      if (activeTab.value && context.events.onTabRefresh) {
        context.events.onTabRefresh(activeTab.value, activeTab.value.key);
      } else {
        context.events.onRefresh?.();
      }
    } finally {
      // 短暂延迟后重置状态（与动画时长一致 --admin-duration-slow）
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      refreshTimer = setTimeout(() => {
        isRefreshing.value = false;
        refreshTimer = null;
      }, 500);
    }
  };

  onUnmounted(() => {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }
  });

  return {
    isRefreshing,
    refresh,
  };
}

/**
 * 使用所有 CSS 变量（布局 + 主题）
 */
export function useAllCSSVariables() {
  const context = useLayoutContext();

  const variables = computed(() => {
    const resolvedProps = getResolvedLayoutProps(context.props);
    return generateAllCSSVariables(resolvedProps, context.state);
  });

  return variables;
}

/**
 * 使用布局与偏好设置联动
 * @description 从 preferences 中获取配置并映射为 layout props
 * 监听 preferences 变化并自动更新布局状态
 */
export function useLayoutPreferences() {
  const context = useLayoutContext();
  const preferencesProps = ref<Partial<BasicLayoutProps>>({});
  const preferencesManager = ref<ReturnType<typeof getPreferencesManager> | null>(null);
  let unsubscribe: (() => void) | null = null;

  const updatePreferencesProps = () => {
    const manager = preferencesManager.value;
    if (!manager) return;
    const prefs = manager.getPreferences();
    preferencesProps.value = { ...mapPreferencesToLayoutProps(prefs) };
  };

  onMounted(() => {
    try {
      preferencesManager.value = getPreferencesManager();
      updatePreferencesProps();
      unsubscribe = preferencesManager.value.subscribe(() => {
        updatePreferencesProps();
      });
    } catch {
      // preferences-vue 未安装或未初始化，这是正常的可选依赖场景
    }
  });

  // 合并后的配置（preferences + 用户 props，用户 props 优先）
  const mergedProps = computed(() => ({
    ...preferencesProps.value,
    ...context.props,
  }));

  // 布局类型
  const layoutType = computed(() => mergedProps.value.layout || 'sidebar-nav');

  // 主题模式
  const themeMode = computed(() => mergedProps.value.theme?.mode || 'light');
  const isDark = computed(() => themeMode.value === 'dark');

  // 侧边栏配置
  const sidebarConfig = computed(() => ({
    width: mergedProps.value.sidebar?.width,
    collapsedWidth: mergedProps.value.sidebar?.collapseWidth,
    hidden: mergedProps.value.sidebar?.hidden,
    ...mergedProps.value.sidebar,
  }));

  // 顶栏配置
  const headerConfig = computed(() => ({
    height: mergedProps.value.header?.height,
    hidden: mergedProps.value.header?.hidden,
    ...mergedProps.value.header,
  }));

  // 标签栏配置
  const tabbarConfig = computed(() => ({
    enable: mergedProps.value.tabbar?.enable,
    height: mergedProps.value.tabbar?.height,
    draggable: mergedProps.value.tabbar?.draggable,
    wheelable: mergedProps.value.tabbar?.wheelable,
    showMaximize: mergedProps.value.tabbar?.showMaximize,
    middleClickToClose: mergedProps.value.tabbar?.middleClickToClose,
    ...mergedProps.value.tabbar,
  }));

  // 页脚配置
  const footerConfig = computed(() => ({
    enable: mergedProps.value.footer?.enable,
    fixed: mergedProps.value.footer?.fixed,
    ...mergedProps.value.footer,
  }));

  // 监听 preferences 变化，更新布局状态
  onUnmounted(() => {
    unsubscribe?.();
  });

  return {
    preferencesProps,
    mergedProps,
    layoutType,
    themeMode,
    isDark,
    sidebarConfig,
    headerConfig,
    tabbarConfig,
    footerConfig,
  };
}
