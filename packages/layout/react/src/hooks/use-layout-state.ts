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

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLayoutContext, useLayoutComputed, useLayoutState } from './use-layout-context';
import {
  BREAKPOINTS,
  HEADER_TRIGGER_DISTANCE,
  TIMING,
  TabManager,
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

// ============================================================
// 1. 帮助函数
// ============================================================
function unwrapCurrentPath(path: string | { value: string } | undefined): string {
  if (!path) return '';
  if (typeof path === 'string') return path;
  return path.value;
}

function buildMenuPathIndex(menus: MenuItem[]) {
  const byKey = new Map<string, MenuItem>();
  const byPath = new Map<string, MenuItem>();
  const chainByKey = new Map<string, string[]>();
  const chainByPath = new Map<string, string[]>();
  const pathItems: MenuItem[] = [];
  const stack: string[] = [];

  const walk = (items: MenuItem[]) => {
    for (const item of items) {
      if (item.key) {
        byKey.set(item.key, item);
      }
      if (item.path) {
        byPath.set(item.path, item);
        pathItems.push(item);
      }
      const chain = item.key ? [...stack, item.key] : [...stack];
      if (item.key) {
        chainByKey.set(item.key, chain);
      }
      if (item.path) {
        chainByPath.set(item.path, chain);
      }
      if (item.key) {
        stack.push(item.key);
      }
      if (item.children?.length) {
        walk(item.children);
      }
      if (item.key) {
        stack.pop();
      }
    }
  };

  walk(menus);
  pathItems.sort((a, b) => (b.path?.length ?? 0) - (a.path?.length ?? 0));
  return { byKey, byPath, chainByKey, chainByPath, pathItems };
}

const menuIndexCache = new WeakMap<MenuItem[], ReturnType<typeof buildMenuPathIndex>>();

function getMenuPathIndex(menus: MenuItem[]) {
  const cached = menuIndexCache.get(menus);
  if (cached) return cached;
  const index = buildMenuPathIndex(menus);
  menuIndexCache.set(menus, index);
  return index;
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
  location?: { pathname: string }
): RouterConfig | undefined {
  if (!navigate || !location) {
    return undefined;
  }

  return {
    navigate: (path: string, options?: { replace?: boolean; query?: Record<string, any> }) => {
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
    currentPath: location.pathname,
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

  // 递归查找第一个可激活的子菜单
  const findFirstActivatableChild = useCallback((menus: MenuItem[]): MenuItem | null => {
    for (const menu of menus) {
      // 跳过隐藏和禁用的菜单
      if (menu.hidden || menu.disabled) continue;
      
      // 如果有路径或外链，返回该菜单
      if (menu.path || menu.externalLink) {
        return menu;
      }
      
      // 递归查找子菜单
      if (menu.children?.length) {
        const child = findFirstActivatableChild(menu.children);
        if (child) return child;
      }
    }
    return null;
  }, []);

  const handleMenuItemClick = useCallback((menu: MenuItem) => {
    if (menu.externalLink) {
      const target = menu.openInNewWindow !== false ? '_blank' : '_self';
      window.open(menu.externalLink, target);
      return;
    }

    if (menu.path) {
      const targetPath = menu.redirect || menu.path;
      navigate(targetPath, {
        params: menu.params,
        query: menu.query,
      });
      return;
    }

    // autoActivateChild：如果菜单没有路径但有子菜单，自动激活第一个可用的子菜单
    if (context.props.sidebar?.autoActivateChild && menu.children?.length) {
      const firstChild = findFirstActivatableChild(menu.children);
      if (firstChild) {
        // 递归调用自身
        if (firstChild.externalLink) {
          const target = firstChild.openInNewWindow !== false ? '_blank' : '_self';
          window.open(firstChild.externalLink, target);
        } else if (firstChild.path) {
          const targetPath = firstChild.redirect || firstChild.path;
          navigate(targetPath, {
            params: firstChild.params,
            query: firstChild.query,
          });
        }
      }
    }
  }, [navigate, context.props.sidebar?.autoActivateChild, findFirstActivatableChild]);

  const handleTabClick = useCallback((tab: TabItem) => {
    if (tab.path && tab.path !== currentPath) {
      navigate(tab.path);
    }
  }, [navigate, currentPath]);

  const handleBreadcrumbClick = useCallback((item: BreadcrumbItem) => {
    if (item.path && item.clickable && item.path !== currentPath) {
      navigate(item.path);
    }
  }, [navigate, currentPath]);

  const handleTabCloseNavigate = useCallback((
    closedKey: string,
    tabs: TabItem[],
    activeKey: string
  ) => {
    if (closedKey === activeKey && tabs.length > 0) {
      let closedIndex = -1;
      for (let i = 0; i < tabs.length; i += 1) {
        if (tabs[i].key === closedKey) {
          closedIndex = i;
          break;
        }
      }
      // 安全的数组访问：优先选择下一个标签，否则选择上一个，最后选择第一个
      let nextTab: TabItem | undefined;
      if (closedIndex >= 0 && closedIndex < tabs.length) {
        nextTab = tabs[closedIndex];
      } else if (closedIndex > 0) {
        nextTab = tabs[closedIndex - 1];
      } else if (tabs.length > 0) {
        nextTab = tabs[0];
      }
      if (nextTab) {
        navigate(nextTab.path);
      }
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

  const collapsed = state.sidebarCollapsed;
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
        if (prev.sidebarCollapsed === value) return prev;
        changed = true;
        return { ...prev, sidebarCollapsed: value };
      });
      if (changed) {
        context.events.onSidebarCollapse?.(value);
      }
    },
    [setState, context.events]
  );

  const toggle = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed, setCollapsed]);

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
      // 非固定模式下，鼠标移出时隐藏子菜单面板
      if (!expandOnHover) {
        setExtraVisible(false);
      }
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

  const hidden = state.headerHidden;
  const height = computed.headerHeight;
  const visible = computed.showHeader;
  const mode = context.props.header?.mode || 'fixed';

  const setHidden = useCallback(
    (value: boolean) => {
      setState((prev) => (prev.headerHidden === value ? prev : { ...prev, headerHidden: value }));
    },
    [setState]
  );

  useEffect(() => {
    if (mode !== 'auto' && mode !== 'auto-scroll') return;

    let mouseY = 0;
    let lastScrollY = 0;
    let animationFrame: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      mouseY = e.clientY;
    };

    const handleScroll = () => {
      if (animationFrame) return;

      animationFrame = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;

        if (mode === 'auto') {
          setHidden(mouseY > HEADER_TRIGGER_DISTANCE);
        } else if (mode === 'auto-scroll') {
          if (currentScrollY > lastScrollY && currentScrollY > height) {
            setHidden(true);
          } else if (currentScrollY < lastScrollY) {
            setHidden(false);
          }
        }

        lastScrollY = currentScrollY;
        animationFrame = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    if (mode === 'auto') {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
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

  const openKeys = state.openMenuKeys;
  const activeKey = context.props.activeMenuKey || currentPath;
  const menus = context.props.menus || [];
  const menuIndex = useMemo(
    () => getMenuPathIndex(context.props.menus || []),
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
    if (!currentPath) return;
    
    const menu = menuIndex.byPath.get(currentPath) ?? menuIndex.byKey.get(currentPath);
    if (menu) {
      const chain =
        menuIndex.chainByPath.get(currentPath) ??
        (menu.key ? menuIndex.chainByKey.get(menu.key) : undefined) ??
        [];
      if (chain.length > 1) {
        const parentKeys = chain.slice(0, -1);
        if (isAccordion) {
          setOpenKeys([parentKeys[parentKeys.length - 1]!]);
        } else {
          // 使用函数式更新避免依赖 openKeys
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
        }
      }
    }
  }, [currentPath, menuIndex, isAccordion, setOpenKeys, setState]);

  const handleSelect = useCallback(
    (key: string) => {
      const item = menuIndex.byKey.get(key);
      if (item) {
        handleMenuItemClick(item);
        context.events.onMenuSelect?.(item, key);
      }
    },
    [menuIndex, handleMenuItemClick, context.events]
  );

  const handleOpenChange = useCallback(
    (keys: string[]) => {
      if (context.props.navigation?.accordion) {
        const nextKeys = keys.length > 0 ? [keys[keys.length - 1]!] : [];
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
  const { currentPath, handleTabClick, handleTabCloseNavigate } = useRouter();

  const [internalTabs, setInternalTabs] = useState<TabItem[]>([]);

  const isAutoMode = context.props.autoTab?.enabled !== false;

  const tabManagerRef = useRef<TabManager>(
    getOrCreateTabManager({
      maxCount: context.props.autoTab?.maxCount || context.props.tabbar?.maxCount || 0,
      affixTabs: context.props.autoTab?.affixKeys,
      persistKey: context.props.autoTab?.persistKey,
      onChange: setInternalTabs,
    })
  );

  // 初始化
  useEffect(() => {
    setInternalTabs(tabManagerRef.current.getTabs());
  }, []);

  const tabs = isAutoMode ? internalTabs : (context.props.tabs || []);
  const activeKey = context.props.activeTabKey || currentPath;
  const tabMap = useMemo(() => {
    const map = new Map<string, TabItem>();
    for (const tab of tabs) {
      map.set(tab.key, tab);
    }
    return map;
  }, [tabs]);
  const menuIndex = useMemo(
    () => getMenuPathIndex(context.props.menus || []),
    [context.props.menus]
  );

  // 监听当前路径变化，自动添加标签
  useEffect(() => {
    if (!isAutoMode || !currentPath) return;

    let menu =
      menuIndex.byPath.get(currentPath) ??
      menuIndex.byKey.get(currentPath);
    if (!menu) {
      for (const item of menuIndex.pathItems) {
        if (item.path && currentPath.startsWith(item.path)) {
          menu = item;
          break;
        }
      }
    }

    if (menu && menu.path && !menu.hideInTab) {
      const newTabs = tabManagerRef.current.addTabFromMenu(menu, {
        affix: menu.affix,
      });
      setInternalTabs(newTabs);
    }
  }, [currentPath, isAutoMode, menuIndex]);

  // 监听固定标签配置变化
  useEffect(() => {
    const keys = context.props.autoTab?.affixKeys;
    if (keys) {
      tabManagerRef.current.setAffixTabs(keys);
      setInternalTabs(tabManagerRef.current.getTabs());
    }
  }, [context.props.autoTab?.affixKeys]);

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
        if (isAutoMode) {
          const newTabs = tabManagerRef.current.removeTab(key);
          setInternalTabs(newTabs);
          handleTabCloseNavigate(key, newTabs, activeKey);
        }
        context.events.onTabClose?.(item, key);
      }
    },
    [tabMap, isAutoMode, activeKey, handleTabCloseNavigate, context.events]
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
      const item = tabMap.get(key);
      if (item) {
        context.events.onTabRefresh?.(item, key);
      }
    },
    [tabMap, context.events]
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
    () => getMenuPathIndex(context.props.menus || []),
    [context.props.menus]
  );

  const breadcrumbs = useMemo(() => {
    if (!isAutoMode) {
      return context.props.breadcrumbs || [];
    }

    const path = currentPath;
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
      menuIndex.byPath.get(path) ??
      menuIndex.byKey.get(path);
    if (!menu) {
      for (const item of menuIndex.pathItems) {
        if (item.path && path.startsWith(item.path)) {
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
      const menuItem = menuIndex.byKey.get(key);
      if (!menuItem) continue;
      if (showHome && menuItem.path === homePath) continue;
      items.push({
        key: `__breadcrumb_${menuItem.key}__`,
        name: menuItem.name,
        icon: menuItem.icon,
        path: menuItem.path,
        clickable: !!menuItem.path && menuItem.path !== path,
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
    () => getMenuPathIndex(context.props.menus || []),
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

    let menu =
      menuIndex.byPath.get(currentPath) ??
      menuIndex.byKey.get(currentPath);
    if (!menu) {
      for (const item of menuIndex.pathItems) {
        if (item.path && currentPath.startsWith(item.path)) {
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
 */
export function useRefresh() {
  const context = useLayoutContext();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventsRef = useRef(context.events);
  eventsRef.current = context.events;

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const refresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      eventsRef.current.onRefresh?.();
    } finally {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setIsRefreshing(false);
        timerRef.current = null;
      }, 300);
    }
  }, [isRefreshing]);

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
