/**
 * 基础布局组件。
 * @description 开箱即用的管理后台布局容器，内置偏好设置能力并自动响应主题/布局等偏好变化。
 */

import {
  mapPreferencesToLayoutProps,
  getCachedMenuPathIndex,
  getCachedFilteredMenus,
  logger,
  rafThrottle,
  LAYOUT_UI_TOKENS,
  getCachedHeaderMenus,
  resolveHeaderActiveKey,
} from '@admin-core/layout';
import {
  PreferencesProvider,
  PreferencesDrawer,
  initPreferences,
  getPreferencesManager,
  usePreferencesContext,
  type PreferencesDrawerUIConfig,
} from '@admin-core/preferences-react';
import { useEffect, useState, useMemo, useCallback, useRef, memo, startTransition, type ReactNode, type CSSProperties } from 'react';
import { LayoutProvider, useLayoutComputed, useLayoutCSSVars, useLayoutState, useLayoutContext, useRouter } from '../../hooks';
import { useResponsive } from '../../hooks/use-layout-state';
import { renderLayoutIcon } from '../../utils';
import { ErrorBoundary } from '../ErrorBoundary';
import { HorizontalMenu } from '../menu';
import { HeaderToolbar, Breadcrumb } from '../widgets';
import { LayoutContent } from './LayoutContent';
import { LayoutFooter } from './LayoutFooter';
import { LayoutHeader } from './LayoutHeader';
import { LayoutOverlay } from './LayoutOverlay';
import { LayoutPanel } from './LayoutPanel';
import { LayoutProgress } from './LayoutProgress';
import { LayoutSidebar } from './LayoutSidebar';
import { LayoutTabbar } from './LayoutTabbar';
import type { SupportedLocale, BasicLayoutProps, LayoutEvents, RouterConfig, MenuItem, TabItem, NotificationItem, BreadcrumbItem  } from '@admin-core/layout';

/** 开发环境标识。 */
const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';
/** 空菜单常量。 */
const EMPTY_MENUS: MenuItem[] = [];
/** 空菜单索引缓存。 */
const EMPTY_MENU_INDEX = getCachedMenuPathIndex(EMPTY_MENUS);

/**
 * 悬浮偏好按钮坐标。
 */
interface FloatingPosition {
  /** 横向坐标。 */
  x: number;
  /** 纵向坐标。 */
  y: number;
}

/**
 * 悬浮偏好按钮贴边方向。
 */
type FloatingEdge = 'left' | 'right' | 'top' | 'bottom';

/**
 * 悬浮按钮拖拽中的位置快照。
 */
interface FloatingDragSnapshot {
  /** 拖拽起点 x。 */
  startX: number;
  /** 拖拽起点 y。 */
  startY: number;
  /** 拖拽开始时原始 x。 */
  originX: number;
  /** 拖拽开始时原始 y。 */
  originY: number;
}

/**
 * 悬浮按钮持久化存储结构。
 */
interface StoredFloatingPosition {
  /** 存储的 x 坐标。 */
  x?: number;
  /** 存储的 y 坐标。 */
  y?: number;
  /** 存储的贴边方向。 */
  edge?: FloatingEdge | null;
}

/**
 * 浏览器 UA Data 兼容结构。
 */
interface NavigatorWithUserAgentData extends Navigator {
  /** 浏览器 UA 数据。 */
  userAgentData?: {
    /** 平台标识。 */
    platform?: string;
  };
}

/**
 * 布局插槽 Props。
 * @description 定义布局各区域可替换内容，便于业务按需覆盖默认实现。
 */
export interface LayoutSlots {
  /** 顶栏插槽。 */
  /** 顶栏 Logo 区域。 */
  headerLogo?: ReactNode;
  /** 顶栏左侧区域。 */
  headerLeft?: ReactNode;
  /** 顶栏中间区域。 */
  headerCenter?: ReactNode;
  /** 顶栏菜单区域。 */
  headerMenu?: ReactNode;
  /** 顶栏右侧区域。 */
  headerRight?: ReactNode;
  /** 顶栏操作区。 */
  headerActions?: ReactNode;
  /** 顶栏用户区。 */
  headerUser?: ReactNode;
  /** 用户下拉菜单区。 */
  userDropdownMenu?: ReactNode;
  /** 顶栏扩展区。 */
  headerExtra?: ReactNode;
  /** 侧边栏插槽。 */
  /** 侧边栏 Logo 区域。 */
  sidebarLogo?: ReactNode;
  /** 侧边栏菜单区域。 */
  sidebarMenu?: ReactNode;
  /** 混合导航侧边菜单区域。 */
  sidebarMixedMenu?: ReactNode;
  /** 侧边栏扩展区。 */
  sidebarExtra?: ReactNode;
  /** 侧边栏底部区域。 */
  sidebarFooter?: ReactNode;
  /** 标签栏插槽。 */
  /** 标签栏左侧区域。 */
  tabbarLeft?: ReactNode;
  /** 标签栏中间主区域。 */
  tabbarSlot?: ReactNode;
  /** 标签栏右侧区域。 */
  tabbarRight?: ReactNode;
  /** 标签栏扩展区。 */
  tabbarExtra?: ReactNode;
  /** 内容区插槽。 */
  /** 内容区头部。 */
  contentHeader?: ReactNode;
  /** 面包屑插槽。 */
  breadcrumbSlot?: ReactNode;
  /** 内容主体。 */
  content?: ReactNode;
  /** 内容区底部。 */
  contentFooter?: ReactNode;
  /** 内容区覆盖层。 */
  contentOverlay?: ReactNode;
  /** 页脚插槽。 */
  /** 页脚左侧。 */
  footerLeft?: ReactNode;
  /** 页脚中间。 */
  footerCenter?: ReactNode;
  /** 页脚右侧。 */
  footerRight?: ReactNode;
  /** 功能区插槽。 */
  /** 面板头部。 */
  panelHeader?: ReactNode;
  /** 面板主体。 */
  panelSlot?: ReactNode;
  /** 面板底部。 */
  panelFooter?: ReactNode;
  /** 其他插槽。 */
  /** 布局扩展区域。 */
  extra?: ReactNode;
  /** 偏好设置按钮插槽。 */
  preferencesButton?: ReactNode;
}

/**
 * BasicLayout 组件 Props。
 * @description 在 core 布局属性基础上扩展 React 插槽、样式与事件回调参数。
 */
export interface BasicLayoutComponentProps extends BasicLayoutProps, LayoutSlots {
  /** 当前语言。 */
  locale?: SupportedLocale;
  /** 自定义国际化消息。 */
  customMessages?: Record<string, Record<string, unknown>>;
  /** 子节点。 */
  children?: ReactNode;
  /** 自定义类名。 */
  className?: string;
  /** 自定义样式。 */
  style?: CSSProperties;
  /** 路由配置（用于内置路由处理）。 */
  router?: RouterConfig;
  /** 是否显示偏好设置按钮。 */
  showPreferencesButton?: boolean;
  /** 偏好设置按钮位置。 */
  preferencesButtonPosition?: 'header' | 'fixed' | 'auto';
  /** 偏好设置 UI 配置（控制显示/禁用）。 */
  preferencesUIConfig?: PreferencesDrawerUIConfig;
  /** 自定义偏好设置按钮图标。 */
  preferencesButtonIcon?: ReactNode;
  /** 侧边栏折叠状态变化时触发。 */
  onSidebarCollapse?: (collapsed: boolean) => void;
  /** 选择菜单项时触发。 */
  onMenuSelect?: (item: MenuItem, key: string) => void;
  /** 切换标签页时触发。 */
  onTabSelect?: (item: TabItem, key: string) => void;
  /** 关闭单个标签页时触发。 */
  onTabClose?: (item: TabItem, key: string) => void;
  /** 关闭全部标签页时触发。 */
  onTabCloseAll?: () => void;
  /** 关闭其他标签页时触发。 */
  onTabCloseOther?: (exceptKey: string) => void;
  /** 刷新标签页时触发。 */
  onTabRefresh?: (item: TabItem, key: string) => void;
  /** 标签栏最大化状态变化时触发。 */
  onTabMaximize?: (isMaximized: boolean) => void;
  /** 点击面包屑项时触发。 */
  onBreadcrumbClick?: (item: BreadcrumbItem, key: string) => void;
  /** 用户下拉菜单项点击时触发。 */
  onUserMenuSelect?: (key: string) => void;
  /** 点击通知项时触发。 */
  onNotificationClick?: (item: NotificationItem) => void;
  /** 全屏状态变化时触发。 */
  onFullscreenToggle?: (isFullscreen: boolean) => void;
  /** 主题切换时触发。 */
  onThemeToggle?: (theme: string) => void;
  /** 语言切换时触发。 */
  onLocaleChange?: (locale: string) => void;
  /** 触发锁屏动作时触发。 */
  onLockScreen?: () => void;
  /** 触发退出登录动作时触发。 */
  onLogout?: () => void;
  /** 侧边功能面板折叠状态变化时触发。 */
  onPanelCollapse?: (collapsed: boolean) => void;
  /** 执行全局搜索时触发。 */
  onGlobalSearch?: (keyword: string) => void;
  /** 触发页面刷新时触发。 */
  onRefresh?: () => void;
  /** 偏好设置面板打开时触发。 */
  onPreferencesOpen?: () => void;
  /** 偏好设置面板关闭时触发。 */
  onPreferencesClose?: () => void;
  /** 标签收藏状态变化时触发。 */
  onTabFavoriteChange?: (menu: MenuItem, favorited: boolean, keys: string[], menus: MenuItem[]) => void;
  /** 收藏菜单集合变化时触发。 */
  onFavoritesChange?: (menus: MenuItem[], keys: string[]) => void;
}

/**
 * 默认设置图标。
 * @description 未传自定义图标时用于偏好设置入口。
 */
const SettingsIcon = () => renderLayoutIcon('settings', 'sm');

/** 偏好设置锁屏桥接组件参数。 */
interface PreferencesLockBridgeProps {
  /** 当锁屏能力可用时回调，返回 `lock` 触发函数。 */
  onReady?: (lock: () => void) => void;
}

/**
 * 偏好设置锁屏桥接组件。
 * @description 将 preferences 的 `lock` 能力回传给布局层。
 */
const PreferencesLockBridge = memo(function PreferencesLockBridge({ onReady }: PreferencesLockBridgeProps) {
  const { lock } = usePreferencesContext();
  const onReadyRef = useRef(onReady);
  const lockRef = useRef(lock);
  const hasCalledRef = useRef(false);

  /**
   * 同步最新 `onReady` 引用，避免闭包陈旧。
   */
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    lockRef.current = lock;
  }, [lock]);

  useEffect(() => {
    /**
     * 防止重复触发（StrictMode 下挂载阶段可能执行两次）。
     */
    if (hasCalledRef.current) {
      return;
    }

    /**
     * 延迟到提交后回调，避免渲染期更新告警。
     */
    if (onReadyRef.current) {
      hasCalledRef.current = true;
      let cancelled = false;
      const schedule =
        typeof queueMicrotask === 'function'
          ? queueMicrotask
          : (callback: () => void) => {
              Promise.resolve().then(callback);
            };
      schedule(() => {
        if (cancelled) return;
        onReadyRef.current?.(lockRef.current);
      });
      return () => {
        cancelled = true;
      };
    }
  }, []); // 只在挂载时执行一次

  return null;
});

/**
 * 内部布局组件。
 * @description 组合头部、侧边栏、标签栏、内容区与偏好面板，并完成布局事件绑定。
 */
function LayoutInner({
  children,
  className,
  style,
  showPreferencesButton = true,
  preferencesButtonPosition = 'auto',
  preferencesButtonIcon,
  preferencesUIConfig,
  onPreferencesOpen,
  onPreferencesClose,
  /** 插槽。 */
  headerLogo,
  headerLeft,
  headerCenter,
  headerMenu,
  headerRight,
  headerActions,
  headerUser,
  userDropdownMenu,
  headerExtra,
  sidebarLogo,
  sidebarMenu,
  sidebarMixedMenu,
  sidebarExtra,
  sidebarFooter,
  tabbarLeft,
  tabbarSlot,
  tabbarRight,
  tabbarExtra,
  contentHeader,
  breadcrumbSlot,
  content,
  contentFooter,
  contentOverlay,
  footerLeft,
  footerCenter,
  footerRight,
  panelHeader,
  panelSlot,
  panelFooter,
  extra,
}: BasicLayoutComponentProps) {
  const computed = useLayoutComputed();
  const cssVars = useLayoutCSSVars();
  const [state, setState] = useLayoutState();
  const { isMobile } = useResponsive();
  const context = useLayoutContext();
  const contextProps = context.props;
  const { currentPath, handleMenuItemClick } = useRouter();

  const resolvedPreferencesButtonPosition =
    preferencesButtonPosition ?? contextProps.preferencesButtonPosition ?? 'auto';
  const preferencesTitle = context.t('layout.widgetLegacy.preferences.title');

  /** 偏好设置抽屉状态。 */
  const [showPreferencesDrawer, setShowPreferencesDrawer] = useState(false);
  const [menuLauncherOpen, setMenuLauncherOpen] = useState(false);
  const [floatingPosition, setFloatingPosition] = useState<FloatingPosition | null>(null);
  const [floatingEdge, setFloatingEdge] = useState<FloatingEdge | null>(null);
  const [floatingDragging, setFloatingDragging] = useState(false);
  const floatingDragRef = useRef<FloatingDragSnapshot | null>(null);
  const floatingMovedRef = useRef(false);
  const floatingButtonRef = useRef<HTMLButtonElement | null>(null);

  const menuLauncherEnabled = useMemo(() => {
    const isHeaderMenuLayout = computed.isHeaderNav || computed.isMixedNav;
    return isHeaderMenuLayout && !computed.isHeaderMixedNav && contextProps.header?.menuLauncher;
  }, [computed.isHeaderNav, computed.isMixedNav, computed.isHeaderMixedNav, contextProps.header?.menuLauncher]);

  const menuLauncherLabel = useMemo(() => {
    return context.t('layout.header.menuLauncher');
  }, [context]);

  const menus = contextProps.menus && contextProps.menus.length > 0
    ? contextProps.menus
    : EMPTY_MENUS;

  const launcherMenus = useMemo(() => {
    if (!menuLauncherEnabled || !menuLauncherOpen) return EMPTY_MENUS;
    return getCachedFilteredMenus(menus);
  }, [menuLauncherEnabled, menuLauncherOpen, menus]);

  const showFloatingPreferencesButton = showPreferencesButton && computed.isFullContent;
  const showFixedPreferencesButton =
    showPreferencesButton && resolvedPreferencesButtonPosition === 'fixed' && !computed.isFullContent;
  const floatingStorageKey = 'admin-core:pref-fab-position';

  /**
   * 将数值限制在给定区间内。
   *
   * @param value 原始值。
   * @param min 最小边界。
   * @param max 最大边界。
   * @returns 夹紧后的结果值。
   */
  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  /**
   * 计算悬浮偏好按钮在当前视口中的可拖拽边界。
   *
   * @returns 包含四个边界值的范围对象。
   */
  const getFloatingBounds = useCallback(() => {
    if (typeof window === 'undefined') {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
    const rect = floatingButtonRef.current?.getBoundingClientRect();
    const width = rect?.width ?? 48;
    const height = rect?.height ?? 48;
    const inset = 8;
    return {
      minX: inset,
      minY: inset,
      maxX: Math.max(inset, window.innerWidth - width - inset),
      maxY: Math.max(inset, window.innerHeight - height - inset),
    };
  }, [floatingButtonRef]);

  /**
   * 将悬浮按钮吸附到离当前位置最近的视口边缘。
   *
   * @param pos 待吸附的位置。
   * @returns 吸附后的坐标与边缘方向。
   */
  const snapFloatingPosition = useCallback(
    (pos: FloatingPosition) => {
      const bounds = getFloatingBounds();
      const x = clamp(pos.x, bounds.minX, bounds.maxX);
      const y = clamp(pos.y, bounds.minY, bounds.maxY);
      const distances = [
        { edge: 'left', value: x - bounds.minX },
        { edge: 'right', value: bounds.maxX - x },
        { edge: 'top', value: y - bounds.minY },
        { edge: 'bottom', value: bounds.maxY - y },
      ];
      distances.sort((a, b) => a.value - b.value);
      const nearest = distances[0]?.edge as FloatingEdge | undefined;
      if (nearest === 'left') return { x: bounds.minX, y, edge: 'left' as const };
      if (nearest === 'right') return { x: bounds.maxX, y, edge: 'right' as const };
      if (nearest === 'top') return { x, y: bounds.minY, edge: 'top' as const };
      return { x, y: bounds.maxY, edge: 'bottom' as const };
    },
    [getFloatingBounds]
  );

  useEffect(() => {
    if (!showFloatingPreferencesButton || floatingPosition) return;
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(floatingStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredFloatingPosition;
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          const bounds = getFloatingBounds();
          setFloatingPosition({
            x: clamp(parsed.x, bounds.minX, bounds.maxX),
            y: clamp(parsed.y, bounds.minY, bounds.maxY),
          });
          setFloatingEdge(parsed.edge ?? null);
          return;
        }
      }
    } catch {}
    const inset = LAYOUT_UI_TOKENS.FLOATING_BUTTON_INSET;
    const size = 48;
    setFloatingPosition({
      x: window.innerWidth - size - inset,
      y: window.innerHeight - size - inset,
    });
  }, [showFloatingPreferencesButton, floatingPosition, getFloatingBounds]);

  useEffect(() => {
    if (!showFloatingPreferencesButton) return;
    const handleResize = rafThrottle(() => {
      setFloatingPosition((prev) => {
        if (!prev) return prev;
        const bounds = getFloatingBounds();
        return {
          x: clamp(prev.x, bounds.minX, bounds.maxX),
          y: clamp(prev.y, bounds.minY, bounds.maxY),
        };
      });
    });
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      /** 清理 `rafThrottle` 的待执行任务。 */
      handleResize.cancel?.();
    };
  }, [showFloatingPreferencesButton, getFloatingBounds]);

  useEffect(() => {
    if (!showFloatingPreferencesButton || !floatingPosition) return;
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        floatingStorageKey,
        JSON.stringify({ x: floatingPosition.x, y: floatingPosition.y, edge: floatingEdge })
      );
    } catch {}
  }, [showFloatingPreferencesButton, floatingPosition, floatingEdge]);

  /**
   * 处理悬浮偏好按钮按下事件，开启拖拽并绑定全局移动/抬起监听。
   *
   * @param event React 指针事件对象。
   */
  const handleFloatingPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (!showFloatingPreferencesButton) return;
      event.preventDefault();
      const target = event.currentTarget;
      target.setPointerCapture?.(event.pointerId);
      setFloatingDragging(true);
      setFloatingEdge(null);
      floatingMovedRef.current = false;

      const rect = target.getBoundingClientRect();
      const originX = floatingPosition?.x ?? rect.left;
      const originY = floatingPosition?.y ?? rect.top;
      floatingDragRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        originX,
        originY,
      };

      /**
       * 处理拖拽移动，实时更新悬浮按钮位置。
       *
       * @param moveEvent 原生指针移动事件。
       */
      const handleMove = (moveEvent: PointerEvent) => {
        if (!floatingDragRef.current) return;
        const { startX, startY, originX: baseX, originY: baseY } = floatingDragRef.current;
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        if (Math.abs(dx) + Math.abs(dy) > 3) {
          floatingMovedRef.current = true;
        }
        const bounds = getFloatingBounds();
        setFloatingPosition({
          x: clamp(baseX + dx, bounds.minX, bounds.maxX),
          y: clamp(baseY + dy, bounds.minY, bounds.maxY),
        });
      };

      /**
       * 处理拖拽结束，执行贴边吸附并清理监听器。
       */
      const handleUp = () => {
        floatingDragRef.current = null;
        setFloatingPosition((prev) => {
          if (!prev) return prev;
          const snapped = snapFloatingPosition(prev);
          setFloatingEdge(snapped.edge);
          return { x: snapped.x, y: snapped.y };
        });
        setFloatingDragging(false);
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
    },
    [
      showFloatingPreferencesButton,
      floatingPosition,
      floatingDragRef,
      floatingMovedRef,
      getFloatingBounds,
      snapFloatingPosition,
    ]
  );

  /**
   * 移动端下自动折叠侧边栏。
   */
  useEffect(() => {
    if (isMobile && !state.sidebarCollapsed) {
      setState((prev) => ({ ...prev, sidebarCollapsed: true }));
    }
  }, [isMobile, state.sidebarCollapsed, setState]);

  /**
   * 打开偏好设置抽屉并触发外部打开回调。
   */
  const openPreferences = useCallback(() => {
    setShowPreferencesDrawer(true);
    onPreferencesOpen?.();
  }, [onPreferencesOpen]);

  /**
   * 关闭偏好设置抽屉并触发外部关闭回调。
   */
  const closePreferences = useCallback(() => {
    setShowPreferencesDrawer(false);
    onPreferencesClose?.();
  }, [onPreferencesClose]);

  /**
   * 处理悬浮按钮点击，过滤拖拽结束后的误触点击。
   */
  const handleFloatingClick = useCallback(() => {
    if (floatingMovedRef.current) {
      floatingMovedRef.current = false;
      return;
    }
    openPreferences();
  }, [openPreferences, floatingMovedRef]);

  const floatingButtonStyle = useMemo(() => {
    if (!floatingPosition) return undefined;
    return {
      left: `${floatingPosition.x}px`,
      top: `${floatingPosition.y}px`,
    } as CSSProperties;
  }, [floatingPosition]);

  /**
   * 关闭顶部菜单启动器弹层。
   */
  const closeMenuLauncher = useCallback(() => {
    setMenuLauncherOpen(false);
  }, []);

  /**
   * 切换顶部菜单启动器弹层开关状态。
   */
  const toggleMenuLauncher = useCallback(() => {
    setMenuLauncherOpen((prev) => !prev);
  }, []);

  /**
   * 水平菜单相关逻辑区。
   */
  
  const isHeaderSidebarNav = computed.currentLayout === 'header-sidebar-nav';

  /**
   * 是否显示顶部导航菜单。
   */
  const showHeaderMenu = useMemo(() => {
    return (computed.isHeaderNav || computed.isMixedNav || computed.isHeaderMixedNav) && !isHeaderSidebarNav;
  }, [computed.isHeaderNav, computed.isMixedNav, computed.isHeaderMixedNav, isHeaderSidebarNav]);

  /**
   * 顶部导航菜单数据。
   */
  const headerMenus = useMemo(() => {
    if (!showHeaderMenu) return EMPTY_MENUS;
    return getCachedHeaderMenus(menus, {
      isHeaderNav: computed.isHeaderNav,
      isMixedNav: computed.isMixedNav,
      isHeaderMixedNav: computed.isHeaderMixedNav,
      isHeaderSidebarNav,
    });
  }, [
    showHeaderMenu,
    menus,
    computed.isHeaderNav,
    computed.isMixedNav,
    computed.isHeaderMixedNav,
    isHeaderSidebarNav,
  ]);

  const needHeaderMenuIndex =
    menuLauncherEnabled || showHeaderMenu || computed.isMixedNav || computed.isHeaderMixedNav;
  const headerMenuIndex = useMemo(
    () => (needHeaderMenuIndex ? getCachedMenuPathIndex(menus) : EMPTY_MENU_INDEX),
    [needHeaderMenuIndex, menus]
  );

  /**
   * 顶部导航菜单激活键。
   */
  const headerActiveKey = useMemo(
    () =>
      resolveHeaderActiveKey({
        activeMenuKey: contextProps.activeMenuKey,
        currentPath: contextProps.currentPath,
        menuIndex: headerMenuIndex,
        mixedNavRootKey: state.mixedNavRootKey,
        isMixedNav: computed.isMixedNav,
        isHeaderMixedNav: computed.isHeaderMixedNav,
        isHeaderSidebarNav,
      }) || undefined,
    [
      contextProps.activeMenuKey,
      contextProps.currentPath,
      headerMenuIndex,
      state.mixedNavRootKey,
      computed.isMixedNav,
      computed.isHeaderMixedNav,
      isHeaderSidebarNav,
    ]
  );

  /**
   * 处理顶部菜单选择，混合导航模式下同步根菜单状态。
   *
   * @param item 当前选中的菜单项。
   * @param key 选中项键值。
   */
  const handleHeaderMenuSelect = useCallback(
    (item: MenuItem, key: string) => {
      if (!computed.isMixedNav && !computed.isHeaderMixedNav) return;
      const nextKey = item.key ?? item.path ?? key;
      if (!nextKey) return;
      /** 使用 `startTransition` 避免渲染路径阻塞。 */
      startTransition(() => {
      setState((prev) => {
        if (prev.mixedNavRootKey === String(nextKey)) return prev;
        return { ...prev, mixedNavRootKey: String(nextKey) };
        });
      });
    },
    [computed.isMixedNav, computed.isHeaderMixedNav, setState]
  );

  /** 顶部菜单对齐方式。 */
  const headerMenuAlign = contextProps.header?.menuAlign || 'start';

  /** 顶部菜单主题（将 `auto` 归一为 `light`）。 */
  const headerMenuTheme = (computed.headerTheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';

  useEffect(() => {
    if (!menuLauncherEnabled) {
      setMenuLauncherOpen(false);
    }
  }, [menuLauncherEnabled]);

  const previousPathRef = useRef(currentPath);
  useEffect(() => {
    const previousPath = previousPathRef.current;
    previousPathRef.current = currentPath;
    if (previousPath === currentPath) return;
    if (!menuLauncherOpen) return;
    /** 仅在路由变化后自动关闭，避免打开后立即关闭。 */
    startTransition(() => {
      setMenuLauncherOpen(false);
    });
  }, [currentPath, menuLauncherOpen]);

  useEffect(() => {
    if (!menuLauncherOpen) return;
    /**
     * 监听 `Escape` 快捷键以关闭菜单启动器。
     *
     * @param event 键盘事件对象。
     */
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuLauncherOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuLauncherOpen]);

  /**
   * 处理菜单启动器项点击，执行导航并维护混合导航根菜单键。
   *
   * @param item 被点击的菜单项。
   */
  const handleLauncherItemClick = useCallback((item: MenuItem) => {
    if (item.disabled) return;
    handleMenuItemClick(item);
    const rawKey = item.key ?? item.path ?? '';
    if (rawKey !== '') {
      context.events?.onMenuSelect?.(item, String(rawKey));
    }
    if (computed.isMixedNav || computed.isHeaderMixedNav) {
      const chain =
        (item.key ? headerMenuIndex.chainByKey.get(item.key) : undefined) ??
        (item.path ? headerMenuIndex.chainByPath.get(item.path) : undefined) ??
        [];
      const rootKey = chain.length > 0 ? chain[0] : rawKey;
      if (rootKey) {
        /** 使用 `startTransition` 避免渲染路径阻塞。 */
        startTransition(() => {
        setState((prev) => {
          if (prev.mixedNavRootKey === String(rootKey)) return prev;
          return { ...prev, mixedNavRootKey: String(rootKey) };
          });
        });
      }
    }
    setMenuLauncherOpen(false);
  }, [handleMenuItemClick, context.events, computed.isMixedNav, computed.isHeaderMixedNav, headerMenuIndex, setState]);

  /**
   * 递归渲染菜单启动器树形节点。
   *
   * @param items 当前层级菜单列表。
   * @param depth 当前递归深度。
   * @returns 菜单列表节点。
   */
  const renderLauncherItems = useCallback(function renderLauncherItems(items: MenuItem[], depth: number) {
    if (!items.length) return null;
    const listClass = depth > 0 ? 'layout-header__launcher-sublist' : 'layout-header__launcher-list';
    return (
      <ul className={listClass} data-depth={depth}>
        {items
          .filter((item) => !item.hidden)
          .map((item) => {
            const key = String(item.key ?? item.path ?? item.name ?? '');
            const isActive = key !== '' && key === String(headerActiveKey ?? '');
            return (
              <li
                key={key}
                className={`layout-header__launcher-item${item.disabled ? ' is-disabled' : ''}`}
                data-active={isActive ? 'true' : undefined}
                data-disabled={item.disabled ? 'true' : undefined}
              >
                <button
                  type="button"
                  className="layout-header__launcher-item-btn"
                  onClick={() => handleLauncherItemClick(item)}
                  disabled={item.disabled}
                  data-active={isActive ? 'true' : undefined}
                >
                  {item.icon && <span className="layout-header__launcher-icon">{item.icon}</span>}
                  <span className="layout-header__launcher-text">{item.name}</span>
                </button>
                {item.children?.length ? renderLauncherItems(item.children, depth + 1) : null}
              </li>
            );
          })}
      </ul>
    );
  }, [handleLauncherItemClick, headerActiveKey]);

  /**
   * 计算布局根节点类名，用于驱动不同布局与状态样式。
   */
  const rootClassName = (() => {
    const classes = ['layout-container', `layout-${computed.currentLayout}`];
    if (isMobile) classes.push('layout-mobile');
    if (state.sidebarCollapsed) classes.push('layout-sidebar-collapsed');
    if (state.headerHidden) classes.push('layout-header-hidden');
    if (state.panelCollapsed) classes.push('layout-panel-collapsed');
    if (className) classes.push(className);
    return classes.join(' ');
  })();

  /**
   * 根节点合并样式（CSS 变量优先注入）。
   */
  const rootStyle: CSSProperties = {
    ...cssVars,
    ...style,
  };

  return (
    <>
      <div className={rootClassName} style={rootStyle}>
        <LayoutProgress />
        {/* 侧边栏 */}
        {computed.showSidebar && (
          <LayoutSidebar
            logo={sidebarLogo}
            menu={sidebarMenu}
            mixedMenu={sidebarMixedMenu}
            extra={sidebarExtra}
            footer={sidebarFooter}
          />
        )}

        {/* 顶栏 */}
        {computed.showHeader && (
          <LayoutHeader
            logo={headerLogo}
            left={headerLeft || (computed.showBreadcrumb ? <Breadcrumb showIcon={contextProps.breadcrumb?.showIcon} showHome={contextProps.breadcrumb?.showHome} /> : undefined)}
            center={headerCenter}
            menu={
              menuLauncherEnabled ? (
                <div className="layout-header__menu-launcher">
                  <button
                    type="button"
                    className="layout-header__launcher-btn"
                    onClick={toggleMenuLauncher}
                    aria-expanded={menuLauncherOpen}
                    aria-label={menuLauncherLabel}
                  >
                    {renderLayoutIcon('menu-launcher', 'sm')}
                    <span>{menuLauncherLabel}</span>
                  </button>
                </div>
              ) : (
                headerMenu || (showHeaderMenu && headerMenus.length > 0 ? (
                  <HorizontalMenu
                    menus={headerMenus}
                    activeKey={headerActiveKey}
                    align={headerMenuAlign}
                    theme={headerMenuTheme}
                    onSelect={handleHeaderMenuSelect}
                  />
                ) : undefined)
              )
            }
            right={headerRight}
            actions={
              headerActions || (
                <HeaderToolbar
                  onOpenPreferences={openPreferences}
                  showPreferencesButton={showPreferencesButton}
                  preferencesButtonPosition={resolvedPreferencesButtonPosition}
                  userSlot={headerUser}
                  userMenuSlot={userDropdownMenu}
                />
              )
            }
            extra={headerExtra}
          />
        )}

        {menuLauncherEnabled && menuLauncherOpen && (
          <div
            className="layout-header__launcher-overlay"
            onClick={closeMenuLauncher}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="layout-header__launcher-panel"
              onClick={(event) => event.stopPropagation()}
            >
              {launcherMenus.length > 0 ? (
                <div className="layout-header__launcher-grid">
                  {launcherMenus.map((menu) => {
                    const key = String(menu.key ?? menu.path ?? menu.name ?? '');
                    const isActive = key !== '' && key === String(headerActiveKey ?? '');
                    const hasChildren = Boolean(menu.children?.length);
                    return (
                      <div key={key} className="layout-header__launcher-group">
                        <button
                          type="button"
                          className={`layout-header__launcher-title${hasChildren ? ' layout-header__launcher-title--group' : ' is-single'}`}
                          onClick={() => handleLauncherItemClick(menu)}
                          disabled={menu.disabled}
                          data-active={isActive ? 'true' : undefined}
                        >
                          {menu.icon && (
                            <span className="layout-header__launcher-icon">{menu.icon}</span>
                          )}
                          <span className="layout-header__launcher-text">{menu.name}</span>
                        </button>
                        {hasChildren ? renderLauncherItems(menu.children || [], 0) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="layout-header__launcher-empty">
                  {context.t('layout.common.noData')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 标签栏 */}
        {computed.showTabbar && (
          <LayoutTabbar
            left={tabbarLeft}
            tabs={tabbarSlot}
            right={tabbarRight}
            extra={tabbarExtra}
          />
        )}

        {/* 主内容区 */}
        <LayoutContent
          header={contentHeader}
          breadcrumb={breadcrumbSlot}
          footer={contentFooter}
          overlay={contentOverlay}
        >
          {content || children}
        </LayoutContent>

        {/* 页脚 */}
        {computed.showFooter && (
          <LayoutFooter
            left={footerLeft}
            center={footerCenter}
            right={footerRight}
          />
        )}

        {/* 功能区 */}
        {computed.showPanel && (
          <LayoutPanel
            header={panelHeader}
            footer={panelFooter}
          >
            {panelSlot}
          </LayoutPanel>
        )}

        {/* 遮罩层 */}
        <LayoutOverlay />

        {/* 额外内容 */}
        {extra}

        {/* 内置偏好设置按钮（固定位置） */}
        {showFixedPreferencesButton && (
          <button
            className="layout-preferences-button"
            title={preferencesTitle}
            onClick={openPreferences}
          >
            {preferencesButtonIcon || <SettingsIcon />}
          </button>
        )}

        {/* 全屏内容布局：可拖拽的偏好设置按钮 */}
        {showFloatingPreferencesButton && (
          <button
            ref={floatingButtonRef}
            type="button"
            className={`layout-preferences-button layout-preferences-button--floating${floatingDragging ? ' layout-preferences-button--dragging' : ''}`}
            title={preferencesTitle}
            style={floatingButtonStyle}
            data-edge={floatingEdge ?? undefined}
            onPointerDown={handleFloatingPointerDown}
            onClick={handleFloatingClick}
          >
            {preferencesButtonIcon || <SettingsIcon />}
          </button>
        )}
      </div>

      {/* 偏好设置抽屉（内置） */}
      <PreferencesDrawer
        uiConfig={preferencesUIConfig}
        open={showPreferencesDrawer}
        onClose={closePreferences}
      />
    </>
  );
}

/**
 * 基础布局组件。
 * @description 对外主入口组件，负责桥接偏好设置系统并渲染完整布局骨架。
 * @param props 布局组件参数。
 * @returns 基础布局节点。
 */
export function BasicLayout(props: BasicLayoutComponentProps) {
  const preferencesManager = useMemo(() => {
    try {
      return getPreferencesManager();
    } catch {
      try {
        initPreferences({ namespace: 'admin-core' });
        return getPreferencesManager();
      } catch (initError) {
        if (isDev) {
          logger.warn('Failed to initialize preferences.', initError);
        }
      }
    }
    return null;
  }, []);

  /**
   * 从偏好设置系统映射布局初始配置。
   */
  const [preferencesProps, setPreferencesProps] = useState<Partial<BasicLayoutProps>>(() => {
    if (preferencesManager) {
      const prefs = preferencesManager.getPreferences();
      return mapPreferencesToLayoutProps(prefs);
    }
    return {};
  });

  /**
   * 订阅偏好设置变化并同步布局配置映射。
   */
  useEffect(() => {
    if (!preferencesManager) return;

    const unsubscribe = preferencesManager.subscribe(() => {
      const prefs = preferencesManager.getPreferences();
      setPreferencesProps(mapPreferencesToLayoutProps(prefs));
    });

    return () => unsubscribe();
  }, [preferencesManager]);

  const [preferencesLock, setPreferencesLock] = useState<(() => void) | null>(null);
  /**
   * 接收偏好模块暴露的锁屏能力并缓存到本地状态。
   *
   * @param lock 锁屏执行函数。
   */
  const handlePreferencesLockReady = useCallback((lock: () => void) => {
    setPreferencesLock(() => lock);
  }, []);

  /**
   * 标记平台类型（用于滚动条样式兼容）。
   */
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const platform =
      (navigator as NavigatorWithUserAgentData)?.userAgentData?.platform ||
      navigator.platform ||
      '';
    const isMac = platform.toLowerCase().includes('mac');
    const value = isMac ? 'macOs' : 'other';
    document.documentElement.setAttribute('data-platform', value);
    document.body?.setAttribute('data-platform', value);
  }, []);

  const {
    locale: localeProp,
    customMessages,
    /** 布局配置入参。 */
    layout: layoutProp,
    isMobile: isMobileProp,
    zIndex,
    header,
    headerTheme,
    sidebar,
    sidebarTheme,
    tabbar,
    autoTab,
    autoBreadcrumb,
    contentCompact,
    contentCompactWidth,
    contentPadding,
    contentPaddingTop,
    contentPaddingBottom,
    contentPaddingLeft,
    contentPaddingRight,
    footer,
    breadcrumb: breadcrumbConfig,
    navigation,
    panel: panelConfig,
    logo,
    appName,
    copyright,
    widgets,
    preferencesButtonPosition,
    visibility,
    disabled,
    router,
    menus,
    currentPath,
    activeMenuKey,
    tabs,
    activeTabKey,
    breadcrumbs,
    userInfo,
    notifications,
    unreadCount,
    /** 事件回调入参。 */
    onSidebarCollapse,
    onMenuSelect,
    onTabSelect,
    onTabClose,
    onTabCloseAll,
    onTabCloseOther,
    onTabRefresh,
    onTabMaximize,
    onBreadcrumbClick,
    onUserMenuSelect,
    onNotificationClick,
    onFullscreenToggle,
    onThemeToggle,
    onLocaleChange,
    onLockScreen,
    onLogout,
    onPanelCollapse,
    onGlobalSearch,
    onRefresh,
    onTabFavoriteChange,
    onFavoritesChange,
  } = props;

  /**
   * 合并基础布局配置（preferences 为底，用户 props 优先）。
   */
  const mergedLayout = layoutProp !== undefined ? layoutProp : preferencesProps.layout;
  const mergedLocale = localeProp ?? preferencesProps.locale ?? 'zh-CN';

  /**
   * 区域配置（header/sidebar/footer 等），变化频率较低。
   */
  const regionConfig = useMemo(() => ({
    header: header ? { ...preferencesProps.header, ...header } : preferencesProps.header,
    headerTheme: headerTheme ?? preferencesProps.headerTheme,
    sidebar: sidebar ? { ...preferencesProps.sidebar, ...sidebar } : preferencesProps.sidebar,
    sidebarTheme: sidebarTheme ?? preferencesProps.sidebarTheme,
    tabbar: tabbar ? { ...preferencesProps.tabbar, ...tabbar } : preferencesProps.tabbar,
    footer: footer ? { ...preferencesProps.footer, ...footer } : preferencesProps.footer,
    panel: panelConfig ?? preferencesProps.panel,
    logo: logo ? { ...preferencesProps.logo, ...logo } : preferencesProps.logo,
  }), [preferencesProps, header, headerTheme, sidebar, sidebarTheme, tabbar, footer, panelConfig, logo]);
  
  /**
   * 内容区配置，变化频率较低。
   */
  const contentConfig = useMemo(() => ({
    contentCompact: contentCompact ?? preferencesProps.contentCompact,
    contentCompactWidth: contentCompactWidth ?? preferencesProps.contentCompactWidth,
    contentPadding: contentPadding ?? preferencesProps.contentPadding,
    contentPaddingTop: contentPaddingTop ?? preferencesProps.contentPaddingTop,
    contentPaddingBottom: contentPaddingBottom ?? preferencesProps.contentPaddingBottom,
    contentPaddingLeft: contentPaddingLeft ?? preferencesProps.contentPaddingLeft,
    contentPaddingRight: contentPaddingRight ?? preferencesProps.contentPaddingRight,
  }), [preferencesProps, contentCompact, contentCompactWidth, contentPadding, contentPaddingTop, contentPaddingBottom, contentPaddingLeft, contentPaddingRight]);
  
  /**
   * 构建最终布局配置对象。
   */
  const layoutProps: BasicLayoutProps = useMemo(() => ({
    ...preferencesProps,
    layout: mergedLayout,
    isMobile: isMobileProp,
    zIndex: zIndex ?? preferencesProps.zIndex,
    ...regionConfig,
    ...contentConfig,
    autoTab: autoTab ?? preferencesProps.autoTab,
    autoBreadcrumb: autoBreadcrumb ?? preferencesProps.autoBreadcrumb,
    breadcrumb: breadcrumbConfig ?? preferencesProps.breadcrumb,
    navigation: navigation ?? preferencesProps.navigation,
    appName: appName ?? preferencesProps.appName,
    copyright: copyright ?? preferencesProps.copyright,
    widgets: widgets ?? preferencesProps.widgets,
    preferencesButtonPosition:
      preferencesButtonPosition ?? preferencesProps.preferencesButtonPosition,
    visibility: visibility ?? preferencesProps.visibility,
    disabled: disabled ?? preferencesProps.disabled,
    router,
    menus,
    currentPath,
    activeMenuKey,
    tabs,
    activeTabKey,
    breadcrumbs,
    userInfo,
    notifications,
    unreadCount,
  }), [
    preferencesProps,
    mergedLayout,
    isMobileProp,
    zIndex,
    regionConfig,
    contentConfig,
    autoTab,
    autoBreadcrumb,
    breadcrumbConfig,
    navigation,
    appName,
    copyright,
    widgets,
    preferencesButtonPosition,
    visibility,
    disabled,
    router,
    menus,
    currentPath,
    activeMenuKey,
    tabs,
    activeTabKey,
    breadcrumbs,
    userInfo,
    notifications,
    unreadCount,
  ]);

  const resolvedLockScreenBackground = useMemo(() => {
    const value = layoutProps.lockScreen?.backgroundImage;
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string' && value.trim() === '') return undefined;
    return value;
  }, [layoutProps.lockScreen?.backgroundImage]);

  /**
   * 触发锁屏动作，优先走偏好系统提供的锁屏能力。
   */
  const handleLockScreen = useCallback(() => {
    if (preferencesLock) {
      preferencesLock();
      return;
    }
    onLockScreen?.();
  }, [preferencesLock, onLockScreen]);

  /**
   * 构建布局事件对象，并在必要时回写偏好设置。
   */
  const events: LayoutEvents = useMemo(() => ({
    onSidebarCollapse: (collapsed: boolean) => {
      /** 同步更新偏好设置。 */
      preferencesManager?.setPreferences({ sidebar: { collapsed } });
      onSidebarCollapse?.(collapsed);
    },
    onMenuSelect,
    onTabSelect,
    onTabClose,
    onTabCloseAll,
    onTabCloseOther,
    onTabRefresh,
    onTabMaximize,
    onBreadcrumbClick,
    onUserMenuSelect,
    onNotificationClick,
    onFullscreenToggle,
    onThemeToggle: (theme: string) => {
      /** 同步更新偏好设置。 */
      preferencesManager?.setPreferences({ theme: { mode: theme as 'light' | 'dark' } });
      onThemeToggle?.(theme);
    },
    onLocaleChange: (locale: string) => {
      /** 同步更新偏好设置。 */
      preferencesManager?.setPreferences({ app: { locale: locale as 'zh-CN' | 'en-US' } });
      onLocaleChange?.(locale);
    },
    onLockScreen: handleLockScreen,
    onLogout,
    onPanelCollapse: (collapsed: boolean) => {
      /** 同步更新偏好设置。 */
      preferencesManager?.setPreferences({ panel: { collapsed } });
      onPanelCollapse?.(collapsed);
    },
    onGlobalSearch,
    onRefresh,
    onTabFavoriteChange,
    onFavoritesChange,
  }), [
    preferencesManager,
    onSidebarCollapse,
    onMenuSelect,
    onTabSelect,
    onTabClose,
    onTabCloseAll,
    onTabCloseOther,
    onTabRefresh,
    onTabMaximize,
    onBreadcrumbClick,
    onUserMenuSelect,
    onNotificationClick,
    onFullscreenToggle,
    onThemeToggle,
    onLocaleChange,
    handleLockScreen,
    onLogout,
    onPanelCollapse,
    onGlobalSearch,
    onRefresh,
    onTabFavoriteChange,
    onFavoritesChange,
  ]);

  return (
    <PreferencesProvider
      showTrigger={false}
      uiConfig={props.preferencesUIConfig}
      onLogout={onLogout}
      onLock={onLockScreen}
      avatar={userInfo?.avatar}
      username={userInfo?.displayName || userInfo?.username}
      lockScreenBackground={resolvedLockScreenBackground}
    >
      <PreferencesLockBridge onReady={handlePreferencesLockReady} />
      <LayoutProvider
        props={layoutProps}
        events={events}
        locale={mergedLocale}
        customMessages={customMessages}
      >
        <ErrorBoundary resetKey={currentPath ?? mergedLocale}>
          <LayoutInner {...props} />
        </ErrorBoundary>
      </LayoutProvider>
    </PreferencesProvider>
  );
}
