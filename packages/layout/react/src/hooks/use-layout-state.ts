/**
 * 布局状态 Hooks
 * @module hooks/use-layout-state
 * @description 管理布局的各种状态
 * 
 * 本文件包含以下功能模块：
 * 
 * 1. 帮助函数 (第 45-70 行)
 *    - unwrapCurrentPath: 路径解包
 * 
 * 2. 区域状态管理 (第 70-330 行)
 *    - useSidebarState: 侧边栏状态
 *    - useHeaderState: 顶栏状态
 *    - useTabbarState: 标签栏状态
 *    - usePanelState: 功能区状态
 *    - useFullscreenState: 全屏状态
 *    - useResponsive: 响应式断点
 * 
 * 3. 路由与导航 (第 330-600 行)
 *    - useReactRouterAdapter: React Router 适配器
 *    - useRouter: 路由操作
 * 
 * 4. 菜单与标签 (第 600-900 行)
 *    - useMenuState: 菜单状态
 *    - useTabsState: 标签页管理
 *    - useBreadcrumbState: 面包屑状态
 * 
 * 5. 主题与样式 (第 900-1050 行)
 *    - useTheme: 主题管理
 *    - useWatermark: 水印
 * 
 * 6. 安全与更新 (第 1050-1200 行)
 *    - useLockScreen: 锁屏
 *    - useCheckUpdates: 检查更新
 * 
 * 7. 偏好与用户 (第 1200-1350 行)
 *    - usePreferencesPanel: 偏好设置面板
 *    - useLocale: 国际化
 *    - useUserInfo: 用户信息
 *    - useNotifications: 通知
 *    - useRefresh: 刷新
 *    - useAllCSSVariables: CSS 变量
 *    - useLayoutPreferences: 偏好设置集成
 */

import {
  BREAKPOINTS,
  HEADER_TRIGGER_DISTANCE,
  TIMING,
  getOrCreateTabManager,
  generateThemeCSSVariables,
  generateThemeClasses,
  generateWatermarkContent,
  shouldShowLockScreen,
  createAutoLockTimer,
  createCheckUpdatesTimer,
  getResolvedLayoutProps,
  generateAllCSSVariables,
  mapPreferencesToLayoutProps,
  logger,
  getMenuId,
  buildMenuPathIndex,
  resolveMenuNavigation,
  getTabNavigationPath,
  getBreadcrumbNavigationPath,
  getNextTabAfterClose,
  type TabManager,
  type BasicLayoutProps,
  type TabItem,
  type BreadcrumbItem,
  type MenuItem,
  type NotificationItem,
  type ThemeConfig,
  type WatermarkConfig,
  type LockScreenConfig,
  type RouterConfig,
} from '@admin-core/layout';
import { getPreferencesManager, type Preferences } from '@admin-core/preferences-react';
import { useState, useEffect, useCallback, useMemo, useRef, startTransition } from 'react';
import { useLayoutContext, useLayoutComputed, useLayoutState } from './use-layout-context';

// ============================================================
// 1. 帮助函数
// ============================================================
function unwrapCurrentPath(path: string | { value: string } | undefined): string {
  if (!path) return '';
  if (typeof path === 'string') return path;
  return path.value;
}

// 使用 core 的 TabManager 缓存管理

// ============================================================
// React Router 适配器
// ============================================================

/**
 * 创建 React Router 适配器
 * @example
 * import { useNavigate, useLocation } from 'react-router-dom';
 * const router = useReactRouterAdapter(useNavigate(), useLocation());
 */
export function useReactRouterAdapter(
  navigate?: (path: string, options?: { replace?: boolean }) => void,
  location?: { pathname: string; search?: string }
): RouterConfig | undefined {
  if (!navigate || !location) {
    return undefined;
  }

  return {
    navigate: (path: string, options?: { replace?: boolean; query?: Record<string, unknown> }) => {
      // React Router v6 处理
      if (options?.query) {
        const searchParams = new URLSearchParams();
        Object.entries(options.query).forEach(([key, value]) => {
          searchParams.set(key, String(value));
        });
        navigate(`${path}?${searchParams.toString()}`, { replace: options?.replace });
      } else {
        navigate(path, { replace: options?.replace });
      }
    },
    currentPath: `${location.pathname}${location.search || ''}`,
    location,
  };
}

// ============================================================
// 内置路由
// ============================================================

/**
 * 使用内置路由
 */
export function useRouter() {
  const context = useLayoutContext();

  const currentPath = useMemo(() => 
    unwrapCurrentPath(context.props.router?.currentPath) || context.props.currentPath || '',
    [context.props.router?.currentPath, context.props.currentPath]
  );

  const navigate = useCallback((
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
  }, [context.props.router]);

  const handleMenuItemClick = useCallback((menu: MenuItem) => {
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
  }, [navigate, context.props.sidebar?.autoActivateChild]);

  const handleTabClick = useCallback((tab: TabItem) => {
    const targetPath = getTabNavigationPath(tab, currentPath);
    if (targetPath) {
      navigate(targetPath);
    }
  }, [navigate, currentPath]);

  const handleBreadcrumbClick = useCallback((item: BreadcrumbItem) => {
    const targetPath = getBreadcrumbNavigationPath(item, currentPath);
    if (targetPath) {
      navigate(targetPath);
    }
  }, [navigate, currentPath]);

  const handleTabCloseNavigate = useCallback((
    closedKey: string,
    tabs: TabItem[],
    activeKey: string
  ) => {
    const nextTab = getNextTabAfterClose(tabs, closedKey, activeKey);
    if (nextTab?.path) {
      navigate(nextTab.path);
    }
  }, [navigate]);

  return {
    currentPath,
    navigate,
    handleMenuItemClick,
    handleTabClick,
    handleBreadcrumbClick,
    handleTabCloseNavigate,
  };
}

// ============================================================
// 布局区域状态
// ============================================================

/**
 * 使用侧边栏状态
 */
export function useSidebarState() {
  const context = useLayoutContext();
  const computed = useLayoutComputed();
  const [state, setState] = useLayoutState();

  const isNonCollapsible = computed.isSidebarMixedNav || computed.isHeaderMixedNav;
  const collapsed = isNonCollapsible ? false : state.sidebarCollapsed;
  const expandOnHovering = state.sidebarExpandOnHovering;
  const extraVisible = state.sidebarExtraVisible;
  const extraCollapsed = state.sidebarExtraCollapsed ?? false;
  const expandOnHover = state.sidebarExpandOnHover ?? false;
  const width = computed.sidebarWidth;
  const visible = computed.showSidebar;

  const setCollapsed = useCallback(
    (value: boolean) => {
      let changed = false;
      setState((prev) => {
        if (computed.isSidebarMixedNav || computed.isHeaderMixedNav) {
          if (!prev.sidebarCollapsed) return prev;
          changed = true;
          return { ...prev, sidebarCollapsed: false };
        }
        if (prev.sidebarCollapsed === value) return prev;
        changed = true;
        return { ...prev, sidebarCollapsed: value };
      });
      if (changed) {
        context.events.onSidebarCollapse?.(
          (computed.isSidebarMixedNav || computed.isHeaderMixedNav) ? false : value
        );
      }
    },
    [setState, context.events, computed.isSidebarMixedNav, computed.isHeaderMixedNav]
  );

  const toggle = useCallback(() => {
    if (computed.isSidebarMixedNav || computed.isHeaderMixedNav) return;
    setCollapsed(!collapsed);
  }, [collapsed, setCollapsed, computed.isSidebarMixedNav, computed.isHeaderMixedNav]);

  const setExpandOnHovering = useCallback(
    (value: boolean) => {
      setState((prev) => (
        prev.sidebarExpandOnHovering === value
          ? prev
          : { ...prev, sidebarExpandOnHovering: value }
      ));
    },
    [setState]
  );

  const setExtraVisible = useCallback(
    (value: boolean) => {
      setState((prev) => (
        prev.sidebarExtraVisible === value
          ? prev
          : { ...prev, sidebarExtraVisible: value }
      ));
    },
    [setState]
  );

  const setExtraCollapsed = useCallback(
    (value: boolean) => {
      setState((prev) => (
        prev.sidebarExtraCollapsed === value
          ? prev
          : { ...prev, sidebarExtraCollapsed: value }
      ));
    },
    [setState]
  );

  const setExpandOnHover = useCallback(
    (value: boolean) => {
      setState((prev) => (
        prev.sidebarExpandOnHover === value
          ? prev
          : { ...prev, sidebarExpandOnHover: value }
      ));
    },
    [setState]
  );

  const handleMouseEnter = useCallback(() => {
    // 只有当 expandOnHover 为 true 时才展开，否则使用弹出菜单
    if (expandOnHover && collapsed) {
      setExpandOnHovering(true);
    }
  }, [expandOnHover, collapsed, setExpandOnHovering]);

  const handleMouseLeave = useCallback(() => {
    if (expandOnHovering) {
      setExpandOnHovering(false);
    }
    // 悬停展开模式下，鼠标移出时隐藏子菜单面板
    if (expandOnHover) {
      setExtraVisible(false);
    }
  }, [expandOnHovering, expandOnHover, setExpandOnHovering, setExtraVisible]);

  return {
    collapsed,
    expandOnHovering,
    extraVisible,
    extraCollapsed,
    expandOnHover,
    width,
    visible,
    layoutComputed: computed,
    setCollapsed,
    toggle,
    setExpandOnHovering,
    setExtraVisible,
    setExtraCollapsed,
    setExpandOnHover,
    handleMouseEnter,
    handleMouseLeave,
  };
}

/**
 * 使用顶栏状态
 */
export function useHeaderState() {
  const context = useLayoutContext();
  const computed = useLayoutComputed();
  const [state, setState] = useLayoutState();

  const hidden = state.headerHidden || context.props.header?.hidden === true;
  const height = computed.headerHeight;
  const visible = computed.showHeader;
  const mode = context.props.header?.mode || 'fixed';
  const hiddenRef = useRef(hidden);

  const setHidden = useCallback(
    (value: boolean) => {
      setState((prev) => (prev.headerHidden === value ? prev : { ...prev, headerHidden: value }));
    },
    [setState]
  );

  useEffect(() => {
    hiddenRef.current = hidden;
  }, [hidden]);

  useEffect(() => {
    if (mode !== 'auto' && mode !== 'auto-scroll') {
      setHidden(false);
      return;
    }

    let mouseY = 0;
    let lastScrollYWindow = typeof window !== 'undefined' ? window.scrollY : 0;
    let lastScrollYElement = 0;
    let scrollRafWindow: number | null = null;
    let scrollRafElement: number | null = null;
    let mouseMoveRaf: number | null = null;
    const scrollTarget =
      (typeof document !== 'undefined' &&
        (document.querySelector('.layout-content') as HTMLElement | null)) ||
      null;
    if (scrollTarget) {
      lastScrollYElement = scrollTarget.scrollTop;
    }
    const hideThreshold = HEADER_TRIGGER_DISTANCE;
    const showThreshold = Math.max(0, HEADER_TRIGGER_DISTANCE - 20);

    const updateHiddenByMouse = () => {
      const currentHidden = hiddenRef.current;
      if (mouseY > hideThreshold && !currentHidden) {
        setHidden(true);
        return;
      }
      if (mouseY < showThreshold && currentHidden) {
        setHidden(false);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseY = e.clientY;
      if (mode === 'auto') {
        if (mouseMoveRaf) return;
        mouseMoveRaf = requestAnimationFrame(() => {
          updateHiddenByMouse();
          mouseMoveRaf = null;
        });
      }
    };

    const updateHiddenByScroll = (currentScrollY: number, lastScrollY: number) => {
      if (mode === 'auto') {
        updateHiddenByMouse();
        return currentScrollY;
      }
      if (mode === 'auto-scroll') {
        if (currentScrollY > lastScrollY && currentScrollY > height) {
          setHidden(true);
        } else if (currentScrollY < lastScrollY) {
          setHidden(false);
        }
      }
      return currentScrollY;
    };

    const handleScrollWindow = () => {
      if (scrollRafWindow) return;
      scrollRafWindow = requestAnimationFrame(() => {
        lastScrollYWindow = updateHiddenByScroll(window.scrollY, lastScrollYWindow);
        scrollRafWindow = null;
      });
    };

    const handleScrollElement = () => {
      if (!scrollTarget) return;
      if (scrollRafElement) return;
      scrollRafElement = requestAnimationFrame(() => {
        lastScrollYElement = updateHiddenByScroll(scrollTarget.scrollTop, lastScrollYElement);
        scrollRafElement = null;
      });
    };

    window.addEventListener('scroll', handleScrollWindow, { passive: true });
    scrollTarget?.addEventListener('scroll', handleScrollElement, { passive: true });
    if (mode === 'auto') {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', handleScrollWindow);
      scrollTarget?.removeEventListener('scroll', handleScrollElement);
      window.removeEventListener('mousemove', handleMouseMove);
      if (scrollRafWindow) cancelAnimationFrame(scrollRafWindow);
      if (scrollRafElement) cancelAnimationFrame(scrollRafElement);
      if (mouseMoveRaf) cancelAnimationFrame(mouseMoveRaf);
    };
  }, [mode, height, setHidden]);

  return {
    hidden,
    height,
    visible,
    mode,
    setHidden,
  };
}

/**
 * 使用标签栏状态
 */
export function useTabbarState() {
  const computed = useLayoutComputed();

  return {
    height: computed.tabbarHeight,
    visible: computed.showTabbar,
  };
}

/**
 * 使用功能区状态
 */
export function usePanelState() {
  const context = useLayoutContext();
  const computed = useLayoutComputed();
  const [state, setState] = useLayoutState();

  const collapsed = state.panelCollapsed;
  const width = computed.panelWidth;
  const visible = computed.showPanel;
  const position = context.props.panel?.position || 'right';

  const setCollapsed = useCallback(
    (value: boolean) => {
      let changed = false;
      setState((prev) => {
        if (prev.panelCollapsed === value) return prev;
        changed = true;
        return { ...prev, panelCollapsed: value };
      });
      if (changed) {
        context.events.onPanelCollapse?.(value);
      }
    },
    [setState, context.events]
  );

  const toggle = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed, setCollapsed]);

  return {
    collapsed,
    width,
    visible,
    position,
    setCollapsed,
    toggle,
  };
}

/**
 * 使用全屏状态
 */
export function useFullscreenState() {
  const context = useLayoutContext();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggle = useCallback(async () => {
    try {
      const nextValue = !document.fullscreenElement;
      if (nextValue) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
      setIsFullscreen((prev) => (prev === nextValue ? prev : nextValue));
      context.events.onFullscreenToggle?.(nextValue);
    } catch (error) {
      logger.error('Fullscreen error:', error);
    }
  }, [context.events]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const nextValue = !!document.fullscreenElement;
      setIsFullscreen((prev) => (prev === nextValue ? prev : nextValue));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

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
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : TIMING.defaultWindowWidth
  );

  const isMobile = width < BREAKPOINTS.md;
  const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
  const isDesktop = width >= BREAKPOINTS.lg;

  const breakpoint = useMemo(() => {
    if (width < BREAKPOINTS.sm) return 'xs';
    if (width < BREAKPOINTS.md) return 'sm';
    if (width < BREAKPOINTS.lg) return 'md';
    if (width < BREAKPOINTS.xl) return 'lg';
    if (width < BREAKPOINTS['2xl']) return 'xl';
    return '2xl';
  }, [width]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    // 节流处理 resize 事件
    const handleResize = () => {
      if (timeoutId) return;
      
      timeoutId = setTimeout(() => {
        const nextWidth = window.innerWidth;
        setWidth((prev) => (prev === nextWidth ? prev : nextWidth));
        timeoutId = null;
      }, TIMING.throttle);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return {
    width,
    isMobile,
    isTablet,
    isDesktop,
    breakpoint,
  };
}

// ============================================================
// 菜单状态
// ============================================================

/**
 * 使用菜单状态
 */
export function useMenuState() {
  const context = useLayoutContext();
  const [state, setState] = useLayoutState();
  const { currentPath, handleMenuItemClick } = useRouter();
  const normalizeKey = useCallback((value: unknown) => {
    if (value === null || value === undefined || value === '') return '';
    return String(value);
  }, []);

  const openKeys = state.openMenuKeys;
  const menuPath = useMemo(
    () => (currentPath ? currentPath.split('?')[0] : ''),
    [currentPath]
  );
  const activeKey = useMemo(() => {
    const candidate = context.props.activeMenuKey ?? menuPath;
    return normalizeKey(candidate);
  }, [context.props.activeMenuKey, menuPath, normalizeKey]);
  const menus = context.props.menus || [];
  const menuIndex = useMemo(
    () => buildMenuPathIndex(context.props.menus || []),
    [context.props.menus]
  );

  const setOpenKeys = useCallback(
    (keys: string[]) => {
      setState((prev) => {
        const prevKeys = prev.openMenuKeys;
        if (prevKeys.length === keys.length) {
          let same = true;
          for (let i = 0; i < keys.length; i += 1) {
            if (prevKeys[i] !== keys[i]) {
              same = false;
              break;
            }
          }
          if (same) return prev;
        }
        return { ...prev, openMenuKeys: keys };
      });
    },
    [setState]
  );

  // 是否为手风琴模式
  const isAccordion = context.props.navigation?.accordion;

  // 根据当前路径自动展开菜单
  useEffect(() => {
    if (!menuPath) return;

    const menu = menuIndex.byPath.get(menuPath) ?? menuIndex.byKey.get(menuPath);
    if (menu) {
      const chain =
        menuIndex.chainByPath.get(menuPath) ??
        (menu.key ? menuIndex.chainByKey.get(menu.key) : undefined) ??
        [];
      if (chain.length > 1) {
        const parentKeys = chain.slice(0, -1);
        if (isAccordion) {
          const lastParentKey = parentKeys[parentKeys.length - 1];
          if (lastParentKey !== undefined) {
            // 使用 startTransition 避免在渲染期间更新组件
            startTransition(() => {
            setOpenKeys([lastParentKey]);
            });
          }
        } else {
          // 使用函数式更新避免依赖 openKeys，使用 startTransition 避免在渲染期间更新组件
          startTransition(() => {
          setState((prev) => {
            const merged = [...new Set([...prev.openMenuKeys, ...parentKeys])];
            if (merged.length === prev.openMenuKeys.length) {
              let same = true;
              for (let i = 0; i < merged.length; i += 1) {
                if (merged[i] !== prev.openMenuKeys[i]) {
                  same = false;
                  break;
                }
              }
              if (same) return prev;
            }
            return { ...prev, openMenuKeys: merged };
            });
          });
        }
      }
    }
  }, [menuPath, menuIndex, isAccordion, setOpenKeys, setState]);

  const handleSelect = useCallback(
    (key: string) => {
      const target = normalizeKey(key);
      if (!target) return;
      const item = menuIndex.byKey.get(target) ?? menuIndex.byPath.get(target);
      if (item) {
        // 使用 startTransition 避免在渲染期间更新组件
        startTransition(() => {
        handleMenuItemClick(item);
        context.events.onMenuSelect?.(item, target);
        });
      }
    },
    [menuIndex, handleMenuItemClick, context.events, normalizeKey]
  );

  const handleOpenChange = useCallback(
    (keys: string[]) => {
      if (context.props.navigation?.accordion) {
        const lastKey = keys[keys.length - 1];
        let nextKeys: string[] = [];
        if (lastKey !== undefined) {
          const menu = menuIndex.byKey.get(lastKey) ?? menuIndex.byPath.get(lastKey);
          const chain =
            (menu?.key ? menuIndex.chainByKey.get(menu.key) : undefined) ??
            (menu?.path ? menuIndex.chainByPath.get(menu.path) : undefined) ??
            [];
          nextKeys = chain.length > 0 ? chain : [lastKey];
        }
        if (nextKeys.length !== openKeys.length || nextKeys[0] !== openKeys[0]) {
          setOpenKeys(nextKeys);
        }
      } else {
        if (keys.length !== openKeys.length) {
          setOpenKeys(keys);
          return;
        }
        let same = true;
        for (let i = 0; i < keys.length; i += 1) {
          if (keys[i] !== openKeys[i]) {
            same = false;
            break;
          }
        }
        if (!same) {
          setOpenKeys(keys);
        }
      }
    },
    [context.props.navigation?.accordion, setOpenKeys, openKeys]
  );

  return {
    openKeys,
    activeKey,
    menus,
    setOpenKeys,
    handleSelect,
    handleOpenChange,
  };
}

// ============================================================
// 标签状态
// ============================================================

/**
 * 使用标签状态（支持自动模式）
 */
export function useTabsState() {
  const context = useLayoutContext();
  const [, setState] = useLayoutState();
  const { currentPath, handleTabClick, handleTabCloseNavigate } = useRouter();

  const [internalTabs, setInternalTabs] = useState<TabItem[]>([]);

  const isAutoMode = context.props.autoTab?.enabled !== false;
  const tabbarConfig = context.props.tabbar || {};
  const maxCount = tabbarConfig.maxCount ?? context.props.autoTab?.maxCount ?? 0;
  const persistKey =
    tabbarConfig.persist === false
      ? undefined
      : context.props.autoTab?.persistKey || 'tabs';

  const tabManagerRef = useRef<TabManager>(
    getOrCreateTabManager({
      maxCount,
      affixTabs: context.props.autoTab?.affixKeys,
      persistKey,
      onChange: setInternalTabs,
    })
  );

  // 初始化
  useEffect(() => {
    setInternalTabs(tabManagerRef.current.getTabs());
  }, []);

  useEffect(() => {
    tabManagerRef.current.updateOptions({
      maxCount,
      persistKey,
    });
    if (!persistKey) {
      tabManagerRef.current.clearStorage();
    }
  }, [maxCount, persistKey]);

  const normalizePath = useCallback((path: string) => path.split('?')[0] || path, []);
  const getPageKey = useCallback((fullPath: string) => {
    if (!fullPath.includes('?')) return '';
    const query = fullPath.split('?')[1]?.split('#')[0] || '';
    if (!query) return '';
    try {
      const params = new URLSearchParams(query);
      return params.get('pageKey') || '';
    } catch {
      return '';
    }
  }, []);
  const resolveTabKey = useCallback(
    (fullPath: string, menu?: MenuItem) => {
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
    },
    [getPageKey, normalizePath]
  );

  const tabs = isAutoMode ? internalTabs : (context.props.tabs || []);
  const tabMap = useMemo(() => {
    const map = new Map<string, TabItem>();
    for (const tab of tabs) {
      map.set(tab.key, tab);
    }
    return map;
  }, [tabs]);
  const menuIndex = useMemo(
    () => buildMenuPathIndex(context.props.menus || []),
    [context.props.menus]
  );

  const resolveMenuByPath = useCallback(
    (path: string) => {
      const basePath = normalizePath(path);
      let menu =
        menuIndex.byPath.get(basePath) ??
        menuIndex.byKey.get(basePath);
      if (!menu) {
        for (const item of menuIndex.pathItems) {
          if (item.path && basePath.startsWith(item.path)) {
            menu = item;
            break;
          }
        }
      }
      return menu;
    },
    [menuIndex, normalizePath]
  );

  const activeKey = useMemo(() => {
    if (context.props.activeTabKey) return context.props.activeTabKey;
    if (!isAutoMode || !currentPath) return currentPath;
    const menu = resolveMenuByPath(currentPath);
    if (!menu) return currentPath;
    return resolveTabKey(currentPath, menu);
  }, [context.props.activeTabKey, currentPath, isAutoMode, resolveMenuByPath, resolveTabKey]);

  const buildTabFromMenu = useCallback(
    (menu: MenuItem, fullPath: string): TabItem => {
      const resolvedFullPath = fullPath || menu.path || '';
      const basePath = normalizePath(resolvedFullPath || menu.path || '');
      const key = resolveTabKey(resolvedFullPath || basePath, menu);
      const baseTab = tabManagerRef.current.createTabFromMenu(menu, { affix: menu.affix });
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
    },
    [getPageKey, normalizePath, resolveTabKey]
  );

  // 监听当前路径变化，自动添加标签
  useEffect(() => {
    if (!isAutoMode || !currentPath) return;

    const menu = resolveMenuByPath(currentPath);

    if (menu && menu.path && !menu.hideInTab) {
      const tab = buildTabFromMenu(menu, currentPath);
      const newTabs = tabManagerRef.current.addTab(tab);
      // 使用 startTransition 避免在渲染期间更新组件
      startTransition(() => {
      setInternalTabs(newTabs);
      });
    }
  }, [currentPath, isAutoMode, resolveMenuByPath, buildTabFromMenu]);

  // 监听固定标签配置变化
  useEffect(() => {
    const keys = context.props.autoTab?.affixKeys;
    if (keys) {
      tabManagerRef.current.setAffixTabs(keys);
      // 使用 startTransition 避免在渲染期间更新组件
      startTransition(() => {
      setInternalTabs(tabManagerRef.current.getTabs());
      });
    }
  }, [context.props.autoTab?.affixKeys]);

  const areArraysEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  };

  useEffect(() => {
    if (tabbarConfig.keepAlive === false) {
      startTransition(() => {
      setState((prev) =>
        prev.keepAliveIncludes.length === 0
          ? prev
          : { ...prev, keepAliveIncludes: [] }
      );
      });
      return;
    }
    const includes = tabs
      .filter((tab) => (tab.meta as Record<string, unknown> | undefined)?.keepAlive !== false)
      .map((tab) => {
        return (
          tab.cacheName ||
          ((tab.meta as Record<string, unknown> | undefined)?.cacheName as string | undefined) ||
          tab.name
        );
      })
      .filter(Boolean) as string[];
    startTransition(() => {
    setState((prev) =>
      areArraysEqual(prev.keepAliveIncludes, includes)
        ? prev
        : { ...prev, keepAliveIncludes: includes }
    );
    });
  }, [tabs, tabbarConfig.keepAlive, setState]);

  const handleSelect = useCallback(
    (key: string) => {
      const item = tabMap.get(key);
      if (item) {
        handleTabClick(item);
        context.events.onTabSelect?.(item, key);
      }
    },
    [tabMap, handleTabClick, context.events]
  );

  const handleClose = useCallback(
    (key: string) => {
      const item = tabMap.get(key);
      if (item && item.closable !== false) {
        const beforeTabs = tabs;
        if (isAutoMode) {
          const newTabs = tabManagerRef.current.removeTab(key);
          setInternalTabs(newTabs);
        }
        handleTabCloseNavigate(key, beforeTabs, activeKey);
        context.events.onTabClose?.(item, key);
      }
    },
    [tabMap, isAutoMode, tabs, activeKey, handleTabCloseNavigate, context.events]
  );

  const handleCloseAll = useCallback(() => {
    if (isAutoMode) {
      const newTabs = tabManagerRef.current.removeAllTabs();
      setInternalTabs(newTabs);
      const firstTab = newTabs[0];
      if (firstTab) {
        handleTabClick(firstTab);
      }
    }
    context.events.onTabCloseAll?.();
  }, [isAutoMode, handleTabClick, context.events]);

  const handleCloseOther = useCallback(
    (key: string) => {
      if (isAutoMode) {
        const newTabs = tabManagerRef.current.removeOtherTabs(key);
        setInternalTabs(newTabs);
      }
      context.events.onTabCloseOther?.(key);
    },
    [isAutoMode, context.events]
  );

  const handleCloseLeft = useCallback(
    (key: string) => {
      if (isAutoMode) {
        const newTabs = tabManagerRef.current.removeLeftTabs(key);
        setInternalTabs(newTabs);
      }
    },
    [isAutoMode]
  );

  const handleCloseRight = useCallback(
    (key: string) => {
      if (isAutoMode) {
        const newTabs = tabManagerRef.current.removeRightTabs(key);
        setInternalTabs(newTabs);
      }
    },
    [isAutoMode]
  );

  const handleRefresh = useCallback(
    (key: string) => {
      if (key === activeKey) {
        setState((prev) => ({ ...prev, refreshKey: prev.refreshKey + 1 }));
      }
      const item = tabMap.get(key);
      if (item) {
        context.events.onTabRefresh?.(item, key);
      }
    },
    [tabMap, context.events, setState, activeKey]
  );

  const handleToggleAffix = useCallback(
    (key: string) => {
      if (isAutoMode) {
        const newTabs = tabManagerRef.current.toggleAffix(key);
        setInternalTabs(newTabs);
      }
    },
    [isAutoMode]
  );

  const handleOpenInNewWindow = useCallback(
    (key: string) => {
      const item = tabMap.get(key);
      if (!item) return;
      const meta = item.meta as Record<string, unknown> | undefined;
      const url =
        (meta?.externalLink as string | undefined) ||
        (meta?.fullPath as string | undefined) ||
        item.path;
      if (url) {
        window.open(url, '_blank');
      }
    },
    [tabMap]
  );

  const handleSort = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (isAutoMode) {
        const newTabs = tabManagerRef.current.sortTabs(fromIndex, toIndex);
        setInternalTabs(newTabs);
      }
    },
    [isAutoMode]
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
    handleSort,
    tabManager: tabManagerRef.current,
  };
}

// ============================================================
// 面包屑状态
// ============================================================

/**
 * 使用面包屑状态（支持自动模式）
 */
export function useBreadcrumbState() {
  const context = useLayoutContext();
  const { currentPath, handleBreadcrumbClick: navigateBreadcrumb } = useRouter();

  const isAutoMode = context.props.autoBreadcrumb?.enabled !== false;
  const breadcrumbConfig = context.props.breadcrumb || {};
  const menuIndex = useMemo(
    () => buildMenuPathIndex(context.props.menus || []),
    [context.props.menus]
  );

  const breadcrumbs = useMemo(() => {
    if (!isAutoMode) {
      return context.props.breadcrumbs || [];
    }

    const path = currentPath;
    const basePath = path ? path.split('?')[0] : '';
    const config = context.props.autoBreadcrumb || {};

    if (!path || menuIndex.byKey.size === 0) {
      return [];
    }

    // 翻译首页名称
    const translatedHomeName = context.t('layout.breadcrumb.home');

    const showHome = config.showHome ?? breadcrumbConfig.showHome ?? true;
    const homePath = config.homePath || context.props.defaultHomePath || '/';
    const hideOnlyOne = breadcrumbConfig.hideOnlyOne ?? true;
    const homeName = config.homeName || translatedHomeName;
    const homeIcon = config.homeIcon || 'home';

    let menu =
      menuIndex.byPath.get(basePath) ??
      menuIndex.byKey.get(basePath);
    if (!menu) {
      for (const item of menuIndex.pathItems) {
        if (item.path && basePath.startsWith(item.path)) {
          menu = item;
          break;
        }
      }
    }
    const chainKeys =
      (menu?.key ? menuIndex.chainByKey.get(menu.key) : undefined) ??
      (menu?.path ? menuIndex.chainByPath.get(menu.path) : undefined) ??
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
      const menuItem = menuIndex.byKey.get(key) ?? menuIndex.byPath.get(key);
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
  }, [
    isAutoMode,
    context.props.breadcrumbs,
    currentPath,
    context.props.autoBreadcrumb,
    context.props.defaultHomePath,
    breadcrumbConfig.showHome,
    breadcrumbConfig.hideOnlyOne,
    context.t,
    menuIndex,
  ]);

  const showIcon = breadcrumbConfig.showIcon !== false;
  const styleType = breadcrumbConfig.styleType || 'normal';

  const handleClick = useCallback(
    (item: BreadcrumbItem) => {
      if (item.clickable && item.path) {
        navigateBreadcrumb(item);
        context.events.onBreadcrumbClick?.(item, item.key);
      }
    },
    [navigateBreadcrumb, context.events]
  );

  return {
    breadcrumbs,
    isAutoMode,
    showIcon,
    styleType,
    handleClick,
  };
}

// ============================================================
// 主题、水印、锁屏等功能
// ============================================================

/**
 * 使用主题
 */
export function useTheme() {
  const context = useLayoutContext();

  const config = useMemo<ThemeConfig>(() => context.props.theme || {}, [context.props.theme]);
  const mode = config.mode || 'light';
  const isDark = mode === 'dark';
  const isAuto = mode === 'auto';

  const [systemDark, setSystemDark] = useState(
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
  );

  const actualMode = useMemo(() => {
    if (isAuto) {
      return systemDark ? 'dark' : 'light';
    }
    return mode;
  }, [isAuto, systemDark, mode]);

  const cssVariables = useMemo(() => generateThemeCSSVariables({ ...config, mode: actualMode }), [config, actualMode]);
  const cssClasses = useMemo(() => generateThemeClasses({ ...config, mode: actualMode }), [config, actualMode]);

  const isGrayMode = config.colorGrayMode === true;
  const isWeakMode = config.colorWeakMode === true;

  useEffect(() => {
    if (typeof window === 'undefined' || !isAuto) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemDark(e.matches);
    };
    mediaQuery.addEventListener('change', handler);
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [isAuto]);

  const toggleTheme = useCallback(() => {
    context.events.onThemeToggle?.(isDark ? 'light' : 'dark');
  }, [isDark, context.events]);

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

  const config = useMemo<WatermarkConfig>(() => context.props.watermark || {}, [context.props.watermark]);
  const enabled = config.enable === true;
  const content = useMemo(() => generateWatermarkContent(config), [config]);

  const style = useMemo(() => {
    if (!enabled) {
      return { display: 'none' as const };
    }

    return {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none' as const,
      zIndex: config.zIndex || 9999,
      opacity: config.opacity || 1,
    };
  }, [enabled, config.zIndex, config.opacity]);

  const canvasConfig = useMemo(() => ({
    content,
    fontSize: config.fontSize || 16,
    fontColor: config.fontColor || 'rgba(0, 0, 0, 0.15)',
    angle: config.angle || -22,
    gap: config.gap || [100, 100] as [number, number],
    offset: config.offset || [50, 50] as [number, number],
  }), [content, config]);

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

  const config = useMemo<LockScreenConfig>(() => context.props.lockScreen || {}, [context.props.lockScreen]);
  const isLocked = shouldShowLockScreen(config);
  const backgroundImage = config.backgroundImage || '';
  const showUserInfo = config.showUserInfo !== false;
  const showClock = config.showClock !== false;
  const showDate = config.showDate !== false;

  const cleanupRef = useRef<(() => void) | null>(null);

  const lock = useCallback(() => {
    context.events.onLockScreen?.();
  }, [context.events]);

  useEffect(() => {
    if (config.autoLockTime && config.autoLockTime > 0) {
      cleanupRef.current = createAutoLockTimer(config, lock);
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [config.autoLockTime, lock]);

  return {
    isLocked,
    backgroundImage,
    showUserInfo,
    showClock,
    showDate,
    config,
    lock,
  };
}

/**
 * 使用检查更新
 */
export function useCheckUpdates(checkFn?: () => Promise<boolean>) {
  const context = useLayoutContext();

  const config = useMemo(() => context.props.checkUpdates || {}, [context.props.checkUpdates]);
  const enabled = config.enable === true;
  const [hasUpdate, setHasUpdate] = useState(false);

  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (enabled && checkFn) {
      cleanupRef.current = createCheckUpdatesTimer(config, setHasUpdate, checkFn);
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [enabled, checkFn, config]);

  return {
    enabled,
    hasUpdate,
    config,
  };
}

/**
 * 使用快捷键
 */
export function useShortcutKeys() {
  const context = useLayoutContext();

  const config = useMemo(() => context.props.shortcutKeys || {}, [context.props.shortcutKeys]);
  const enabled = config.enable !== false;

  // 使用 ref 存储事件处理函数，避免依赖 context.events 导致频繁重绑定
  const eventsRef = useRef(context.events);
  eventsRef.current = context.events;

  useEffect(() => {
    if (!enabled) return;

    const handleKeydown = (e: KeyboardEvent) => {
      const { key, altKey, ctrlKey, metaKey } = e;
      const modKey = ctrlKey || metaKey;

      if (altKey && key.toLowerCase() === 'l' && config.globalLockScreen !== false) {
        e.preventDefault();
        eventsRef.current.onLockScreen?.();
      }

      if (altKey && key.toLowerCase() === 'q' && config.globalLogout !== false) {
        e.preventDefault();
        eventsRef.current.onLogout?.();
      }

      if (modKey && key.toLowerCase() === 'k' && config.globalSearch !== false) {
        e.preventDefault();
        eventsRef.current.onGlobalSearch?.('');
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [enabled, config]);

  return {
    enabled,
    config,
  };
}

/**
 * 使用页面过渡
 */
export function usePageTransition() {
  const context = useLayoutContext();

  const config = useMemo(() => context.props.transition || {}, [context.props.transition]);
  const enabled = config.enable !== false;
  const transitionName = config.name || 'fade-slide';
  const showProgress = config.progress !== false;
  const showLoading = config.loading !== false;

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
  const { currentPath } = useRouter();

  const enabled = context.props.dynamicTitle !== false;
  const appName = context.props.appName || '';
  const menuIndex = useMemo(
    () => buildMenuPathIndex(context.props.menus || []),
    [context.props.menus]
  );

  const updateTitle = useCallback((pageTitle?: string) => {
    if (!enabled || typeof document === 'undefined') return;

    if (pageTitle && appName) {
      document.title = `${pageTitle} - ${appName}`;
    } else if (pageTitle) {
      document.title = pageTitle;
    } else if (appName) {
      document.title = appName;
    }
  }, [enabled, appName]);

  useEffect(() => {
    if (!enabled || !currentPath) return;

    const basePath = currentPath.split('?')[0];
    let menu =
      menuIndex.byPath.get(basePath) ??
      menuIndex.byKey.get(basePath);
    if (!menu) {
      for (const item of menuIndex.pathItems) {
        if (item.path && basePath.startsWith(item.path)) {
          menu = item;
          break;
        }
      }
    }

    if (menu) {
      updateTitle(menu.name);
    }
  }, [enabled, currentPath, menuIndex, updateTitle]);

  return {
    enabled,
    appName,
    updateTitle,
  };
}

/**
 * 使用偏好设置面板
 */
export function usePreferencesPanel() {
  const context = useLayoutContext();

  const enabled = context.props.enablePreferences !== false;
  const position = context.props.preferencesButtonPosition || 'auto';
  const stickyNav = context.props.enableStickyPreferencesNav !== false;

  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    if (enabled) {
      setIsOpen(true);
    }
  }, [enabled]);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    if (enabled) {
      setIsOpen((prev) => !prev);
    }
  }, [enabled]);

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

  const locale = context.props.locale || 'zh-CN';

  const changeLocale = useCallback((newLocale: string) => {
    context.events.onLocaleChange?.(newLocale);
  }, [context.events]);

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

  const userInfo = context.props.userInfo;
  const avatar = userInfo?.avatar || context.props.defaultAvatar || '';
  const displayName = userInfo?.displayName || userInfo?.username || '';
  const roles = userInfo?.roles || [];

  const handleMenuSelect = useCallback((key: string) => {
    context.events.onUserMenuSelect?.(key);
  }, [context.events]);

  const handleLogout = useCallback(() => {
    context.events.onLogout?.();
  }, [context.events]);

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

  const notifications = context.props.notifications || [];
  const unreadCount = context.props.unreadCount || 0;
  const hasUnread = unreadCount > 0;

  const handleClick = useCallback((item: NotificationItem) => {
    context.events.onNotificationClick?.(item);
  }, [context.events]);

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
  const [, setState] = useLayoutState();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventsRef = useRef(context.events);
  eventsRef.current = context.events;

  // 从 context.props 获取标签和活动标签
  const tabs = context.props.tabs || [];
  const { currentPath } = useRouter();
  const activeKey = context.props.activeTabKey || currentPath;

  const activeTab = useMemo(() => {
    if (!activeKey) return undefined;
    return tabs.find((tab) => tab.key === activeKey);
  }, [tabs, activeKey]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const triggerRefresh = useCallback(() => {
    setState((prev) => ({ ...prev, refreshKey: prev.refreshKey + 1 }));
  }, [setState]);

  const refresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      triggerRefresh();
      if (activeTab && eventsRef.current.onTabRefresh) {
        eventsRef.current.onTabRefresh(activeTab, activeTab.key);
      } else {
        eventsRef.current.onRefresh?.();
      }
    } finally {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setIsRefreshing(false);
        timerRef.current = null;
      }, 500); // 与动画时长一致 --admin-duration-slow
    }
  }, [isRefreshing, activeTab, triggerRefresh]);

  return {
    isRefreshing,
    refresh,
  };
}

/**
 * 使用所有 CSS 变量
 */
export function useAllCSSVariables() {
  const context = useLayoutContext();
  const [state] = useLayoutState();

  const variables = useMemo(() => {
    const resolvedProps = getResolvedLayoutProps(context.props);
    return generateAllCSSVariables(resolvedProps, state);
  }, [context.props, state]);

  return variables;
}

/**
 * 使用布局与偏好设置联动
 * @description 从 preferences 中获取配置并映射为 layout props
 * 监听 preferences 变化并自动更新布局状态
 */
export function useLayoutPreferences() {
  const context = useLayoutContext();
  const [preferencesProps, setPreferencesProps] = useState<Partial<BasicLayoutProps>>({});
  
  // 尝试获取 preferences（如果可用）
  const preferencesManagerRef = useRef<ReturnType<typeof getPreferencesManager> | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    // 尝试获取 preferences（如果可用）
    try {
      const manager = getPreferencesManager();
      preferencesManagerRef.current = manager;

      // 初始化配置
      const prefs = manager.getPreferences();
      setPreferencesProps(mapPreferencesToLayoutProps(prefs));

      // 订阅变化
      unsubscribe = manager.subscribe((newPrefs: Preferences) => {
        setPreferencesProps(mapPreferencesToLayoutProps(newPrefs));
      });
    } catch {
      // preferences-react 未安装或未初始化，这是正常的可选依赖场景
    }
    
    return () => {
      unsubscribe?.();
    };
  }, []);

  // 合并后的配置（preferences + 用户 props，用户 props 优先）
  const mergedProps = useMemo(() => ({
    ...preferencesProps,
    ...context.props,
  }), [preferencesProps, context.props]);

  // 布局类型
  const layoutType = mergedProps.layout || 'sidebar-nav';

  // 主题模式
  const themeMode = mergedProps.theme?.mode || 'light';
  const isDark = themeMode === 'dark';

  // 侧边栏配置
  const sidebarConfig = useMemo(() => ({
    width: mergedProps.sidebar?.width,
    collapsedWidth: mergedProps.sidebar?.collapseWidth,
    hidden: mergedProps.sidebar?.hidden,
    ...mergedProps.sidebar,
  }), [mergedProps.sidebar]);

  // 顶栏配置
  const headerConfig = useMemo(() => ({
    height: mergedProps.header?.height,
    hidden: mergedProps.header?.hidden,
    ...mergedProps.header,
  }), [mergedProps.header]);

  // 标签栏配置
  const tabbarConfig = useMemo(() => ({
    enable: mergedProps.tabbar?.enable,
    height: mergedProps.tabbar?.height,
    draggable: mergedProps.tabbar?.draggable,
    wheelable: mergedProps.tabbar?.wheelable,
    showMaximize: mergedProps.tabbar?.showMaximize,
    middleClickToClose: mergedProps.tabbar?.middleClickToClose,
    ...mergedProps.tabbar,
  }), [mergedProps.tabbar]);

  // 页脚配置
  const footerConfig = useMemo(() => ({
    enable: mergedProps.footer?.enable,
    fixed: mergedProps.footer?.fixed,
    ...mergedProps.footer,
  }), [mergedProps.footer]);

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
