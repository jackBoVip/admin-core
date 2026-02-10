/**
 * 基础布局组件
 * @description 开箱即用的管理后台布局，用户只需传入数据即可使用
 * 内置偏好设置功能，无需用户单独配置
 * 自动响应偏好设置变化（布局类型、主题等）
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

// 自动初始化偏好设置（如果尚未初始化）
const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';
const EMPTY_MENUS: MenuItem[] = [];

/**
 * 布局插槽 Props
 */
export interface LayoutSlots {
  // 顶栏插槽
  headerLogo?: ReactNode;
  headerLeft?: ReactNode;
  headerCenter?: ReactNode;
  headerMenu?: ReactNode;
  headerRight?: ReactNode;
  headerActions?: ReactNode;
  headerUser?: ReactNode;
  userDropdownMenu?: ReactNode;
  headerExtra?: ReactNode;
  // 侧边栏插槽
  sidebarLogo?: ReactNode;
  sidebarMenu?: ReactNode;
  sidebarMixedMenu?: ReactNode;
  sidebarExtra?: ReactNode;
  sidebarFooter?: ReactNode;
  // 标签栏插槽
  tabbarLeft?: ReactNode;
  tabbarSlot?: ReactNode;
  tabbarRight?: ReactNode;
  tabbarExtra?: ReactNode;
  // 内容区插槽
  contentHeader?: ReactNode;
  breadcrumbSlot?: ReactNode;
  content?: ReactNode;
  contentFooter?: ReactNode;
  contentOverlay?: ReactNode;
  // 页脚插槽
  footerLeft?: ReactNode;
  footerCenter?: ReactNode;
  footerRight?: ReactNode;
  // 功能区插槽
  panelHeader?: ReactNode;
  panelSlot?: ReactNode;
  panelFooter?: ReactNode;
  // 其他插槽
  extra?: ReactNode;
  preferencesButton?: ReactNode;
}

/**
 * BasicLayout Props
 */
export interface BasicLayoutComponentProps extends BasicLayoutProps, LayoutSlots {
  /** 当前语言 */
  locale?: SupportedLocale;
  /** 自定义国际化消息 */
  customMessages?: Record<string, Record<string, unknown>>;
  /** 子节点 */
  children?: ReactNode;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: CSSProperties;
  /** 路由配置（用于内置路由处理） */
  router?: RouterConfig;
  /** 是否显示偏好设置按钮 */
  showPreferencesButton?: boolean;
  /** 偏好设置按钮位置 */
  preferencesButtonPosition?: 'header' | 'fixed' | 'auto';
  /** 偏好设置 UI 配置（控制显示/禁用） */
  preferencesUIConfig?: PreferencesDrawerUIConfig;
  /** 自定义偏好设置按钮图标 */
  preferencesButtonIcon?: ReactNode;
  // 事件
  onSidebarCollapse?: (collapsed: boolean) => void;
  onMenuSelect?: (item: MenuItem, key: string) => void;
  onTabSelect?: (item: TabItem, key: string) => void;
  onTabClose?: (item: TabItem, key: string) => void;
  onTabCloseAll?: () => void;
  onTabCloseOther?: (exceptKey: string) => void;
  onTabRefresh?: (item: TabItem, key: string) => void;
  onTabMaximize?: (isMaximized: boolean) => void;
  onBreadcrumbClick?: (item: BreadcrumbItem, key: string) => void;
  onUserMenuSelect?: (key: string) => void;
  onNotificationClick?: (item: NotificationItem) => void;
  onFullscreenToggle?: (isFullscreen: boolean) => void;
  onThemeToggle?: (theme: string) => void;
  onLocaleChange?: (locale: string) => void;
  onLockScreen?: () => void;
  onLogout?: () => void;
  onPanelCollapse?: (collapsed: boolean) => void;
  onGlobalSearch?: (keyword: string) => void;
  onRefresh?: () => void;
  onPreferencesOpen?: () => void;
  onPreferencesClose?: () => void;
}

/** 默认设置图标 */
const SettingsIcon = () => renderLayoutIcon('settings', 'sm');

interface PreferencesLockBridgeProps {
  onReady?: (lock: () => void) => void;
}

const PreferencesLockBridge = memo(function PreferencesLockBridge({ onReady }: PreferencesLockBridgeProps) {
  const { lock } = usePreferencesContext();
  const onReadyRef = useRef(onReady);
  const lockRef = useRef(lock);
  const hasCalledRef = useRef(false);

  // 保持最新引用
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    lockRef.current = lock;
  }, [lock]);

  useEffect(() => {
    // 防止重复调用（React StrictMode 会导致组件挂载两次）
    if (hasCalledRef.current) {
      return;
    }
    
    // 延迟调用，避免在渲染期间更新状态
    if (onReadyRef.current) {
      hasCalledRef.current = true;
      setTimeout(() => {
        onReadyRef.current?.(lockRef.current);
      }, 0);
    }
  }, []); // 只在挂载时执行一次

  return null;
});

/**
 * 内部布局组件
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
  // 插槽
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

  // 偏好设置抽屉状态
  const [showPreferencesDrawer, setShowPreferencesDrawer] = useState(false);
  const [menuLauncherOpen, setMenuLauncherOpen] = useState(false);
  const [floatingPosition, setFloatingPosition] = useState<{ x: number; y: number } | null>(null);
  const [floatingEdge, setFloatingEdge] = useState<'left' | 'right' | 'top' | 'bottom' | null>(null);
  const [floatingDragging, setFloatingDragging] = useState(false);
  const floatingDragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
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
    return getCachedFilteredMenus(menus);
  }, [menus]);

  const showFloatingPreferencesButton = showPreferencesButton && computed.isFullContent;
  const showFixedPreferencesButton =
    showPreferencesButton && resolvedPreferencesButtonPosition === 'fixed' && !computed.isFullContent;
  const floatingStorageKey = 'admin-core:pref-fab-position';

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

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

  const snapFloatingPosition = useCallback(
    (pos: { x: number; y: number }) => {
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
      const nearest = distances[0]?.edge as 'left' | 'right' | 'top' | 'bottom' | undefined;
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
        const parsed = JSON.parse(stored) as { x?: number; y?: number; edge?: typeof floatingEdge };
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
      // 清理 rafThrottle 的 pending 状态
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

  // 移动端自动折叠侧边栏
  useEffect(() => {
    if (isMobile && !state.sidebarCollapsed) {
      setState((prev) => ({ ...prev, sidebarCollapsed: true }));
    }
  }, [isMobile, state.sidebarCollapsed, setState]);

  // 打开偏好设置
  const openPreferences = useCallback(() => {
    setShowPreferencesDrawer(true);
    onPreferencesOpen?.();
  }, [onPreferencesOpen]);

  // 关闭偏好设置
  const closePreferences = useCallback(() => {
    setShowPreferencesDrawer(false);
    onPreferencesClose?.();
  }, [onPreferencesClose]);

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

  const closeMenuLauncher = useCallback(() => {
    setMenuLauncherOpen(false);
  }, []);

  const toggleMenuLauncher = useCallback(() => {
    setMenuLauncherOpen((prev) => !prev);
  }, []);

  // ============================================================
  // 水平菜单相关逻辑
  // ============================================================
  
  const isHeaderSidebarNav = computed.currentLayout === 'header-sidebar-nav';

  // 是否显示顶部导航菜单
  const showHeaderMenu = useMemo(() => {
    return (computed.isHeaderNav || computed.isMixedNav || computed.isHeaderMixedNav) && !isHeaderSidebarNav;
  }, [computed.isHeaderNav, computed.isMixedNav, computed.isHeaderMixedNav, isHeaderSidebarNav]);

  // 顶部导航菜单数据
  const headerMenus = useMemo(
    () =>
      getCachedHeaderMenus(menus, {
        isHeaderNav: computed.isHeaderNav,
        isMixedNav: computed.isMixedNav,
        isHeaderMixedNav: computed.isHeaderMixedNav,
        isHeaderSidebarNav,
      }),
    [menus, computed.isHeaderNav, computed.isMixedNav, computed.isHeaderMixedNav, isHeaderSidebarNav]
  );

  const headerMenuIndex = useMemo(
    () => getCachedMenuPathIndex(menus),
    [menus]
  );

  // 顶部导航菜单激活 key
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

  const handleHeaderMenuSelect = useCallback(
    (item: MenuItem, key: string) => {
      if (!computed.isMixedNav && !computed.isHeaderMixedNav) return;
      const nextKey = item.key ?? item.path ?? key;
      if (!nextKey) return;
      // 使用 startTransition 避免在渲染期间更新组件
      startTransition(() => {
      setState((prev) => {
        if (prev.mixedNavRootKey === String(nextKey)) return prev;
        return { ...prev, mixedNavRootKey: String(nextKey) };
        });
      });
    },
    [computed.isMixedNav, computed.isHeaderMixedNav, setState]
  );

  // 菜单对齐方式
  const headerMenuAlign = contextProps.header?.menuAlign || 'start';
  
  // 菜单主题（转换 auto 为 light）
  const headerMenuTheme = (computed.headerTheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';

  useEffect(() => {
    if (!menuLauncherEnabled) {
      setMenuLauncherOpen(false);
    }
  }, [menuLauncherEnabled]);

  useEffect(() => {
    if (menuLauncherOpen) {
      // 使用 startTransition 避免在渲染期间更新组件
      startTransition(() => {
      setMenuLauncherOpen(false);
      });
    }
  }, [currentPath, menuLauncherOpen]);

  useEffect(() => {
    if (!menuLauncherOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuLauncherOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuLauncherOpen]);

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
        // 使用 startTransition 避免在渲染期间更新组件
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

  // 根元素类名
  const rootClassName = (() => {
    const classes = ['layout-container', `layout-${computed.currentLayout}`];
    if (isMobile) classes.push('layout-mobile');
    if (state.sidebarCollapsed) classes.push('layout-sidebar-collapsed');
    if (state.headerHidden) classes.push('layout-header-hidden');
    if (state.panelCollapsed) classes.push('layout-panel-collapsed');
    if (className) classes.push(className);
    return classes.join(' ');
  })();

  // 合并样式
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
 * 基础布局组件
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

  // 从偏好设置获取配置
  const [preferencesProps, setPreferencesProps] = useState<Partial<BasicLayoutProps>>(() => {
    if (preferencesManager) {
      const prefs = preferencesManager.getPreferences();
      return mapPreferencesToLayoutProps(prefs);
    }
    return {};
  });

  // 订阅偏好设置变化
  useEffect(() => {
    if (!preferencesManager) return;

    const unsubscribe = preferencesManager.subscribe(() => {
      const prefs = preferencesManager.getPreferences();
      setPreferencesProps(mapPreferencesToLayoutProps(prefs));
    });

    return () => unsubscribe();
  }, [preferencesManager]);

  const [preferencesLock, setPreferencesLock] = useState<(() => void) | null>(null);
  const handlePreferencesLockReady = useCallback((lock: () => void) => {
    setPreferencesLock(() => lock);
  }, []);

  // 标记平台类型（用于滚动条样式兼容）
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const platform =
      (navigator as Navigator & { userAgentData?: { platform?: string } })?.userAgentData?.platform ||
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
    // Props
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
    // 事件
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
  } = props;

  // 合并配置（preferences 为底，用户 props 优先）
  const mergedLayout = layoutProp !== undefined ? layoutProp : preferencesProps.layout;
  const mergedLocale = localeProp ?? preferencesProps.locale ?? 'zh-CN';
  
  // 区域配置（header, sidebar, footer 等）- 较少变化
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
  
  // 内容配置 - 较少变化
  const contentConfig = useMemo(() => ({
    contentCompact: contentCompact ?? preferencesProps.contentCompact,
    contentCompactWidth: contentCompactWidth ?? preferencesProps.contentCompactWidth,
    contentPadding: contentPadding ?? preferencesProps.contentPadding,
    contentPaddingTop: contentPaddingTop ?? preferencesProps.contentPaddingTop,
    contentPaddingBottom: contentPaddingBottom ?? preferencesProps.contentPaddingBottom,
    contentPaddingLeft: contentPaddingLeft ?? preferencesProps.contentPaddingLeft,
    contentPaddingRight: contentPaddingRight ?? preferencesProps.contentPaddingRight,
  }), [preferencesProps, contentCompact, contentCompactWidth, contentPadding, contentPaddingTop, contentPaddingBottom, contentPaddingLeft, contentPaddingRight]);
  
  // 构建完整布局配置
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

  const handleLockScreen = useCallback(() => {
    if (preferencesLock) {
      preferencesLock();
      return;
    }
    onLockScreen?.();
  }, [preferencesLock, onLockScreen]);

  // 构建事件对象（同步偏好设置）
  const events: LayoutEvents = useMemo(() => ({
    onSidebarCollapse: (collapsed: boolean) => {
      // 同步更新偏好设置
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
      // 同步更新偏好设置
      preferencesManager?.setPreferences({ theme: { mode: theme as 'light' | 'dark' } });
      onThemeToggle?.(theme);
    },
    onLocaleChange: (locale: string) => {
      // 同步更新偏好设置
      preferencesManager?.setPreferences({ app: { locale: locale as 'zh-CN' | 'en-US' } });
      onLocaleChange?.(locale);
    },
    onLockScreen: handleLockScreen,
    onLogout,
    onPanelCollapse: (collapsed: boolean) => {
      // 同步更新偏好设置
      preferencesManager?.setPreferences({ panel: { collapsed } });
      onPanelCollapse?.(collapsed);
    },
    onGlobalSearch,
    onRefresh,
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
