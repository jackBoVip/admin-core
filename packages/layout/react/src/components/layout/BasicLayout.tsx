/**
 * 基础布局组件
 * @description 开箱即用的管理后台布局，用户只需传入数据即可使用
 * 内置偏好设置功能，无需用户单独配置
 * 自动响应偏好设置变化（布局类型、主题等）
 */

import { useEffect, useState, useMemo, type ReactNode, type CSSProperties } from 'react';
import type { BasicLayoutProps, LayoutEvents, RouterConfig, MenuItem, TabItem, NotificationItem, BreadcrumbItem } from '@admin-core/layout';
import type { SupportedLocale } from '@admin-core/layout';
import { mapPreferencesToLayoutProps } from '@admin-core/layout';
import { LayoutProvider, useLayoutComputed, useLayoutCSSVars, useLayoutState, useLayoutContext } from '../../hooks';
import { useResponsive } from '../../hooks/use-layout-state';
import { logger } from '@admin-core/layout';
import { 
  PreferencesProvider, 
  PreferencesDrawer,
  initPreferences,
  getPreferencesManager,
} from '@admin-core/preferences-react';
import { LayoutHeader } from './LayoutHeader';
import { LayoutSidebar } from './LayoutSidebar';
import { LayoutTabbar } from './LayoutTabbar';
import { LayoutContent } from './LayoutContent';
import { LayoutFooter } from './LayoutFooter';
import { LayoutPanel } from './LayoutPanel';
import { LayoutOverlay } from './LayoutOverlay';
import { HorizontalMenu } from '../menu';
import { HeaderToolbar, Breadcrumb } from '../widgets';
import { ErrorBoundary } from '../ErrorBoundary';

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

// 自动初始化偏好设置（如果尚未初始化）
const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';
let preferencesManager: ReturnType<typeof getPreferencesManager> | null = null;
try {
  preferencesManager = getPreferencesManager();
} catch (error) {
  try {
    initPreferences({ namespace: 'admin-core' });
    preferencesManager = getPreferencesManager();
  } catch (initError) {
    if (isDev) {
      logger.warn('Failed to initialize preferences.', initError);
    }
  }
}

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
const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

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
  onPreferencesOpen,
  onPreferencesClose,
  // 插槽
  headerLogo,
  headerLeft,
  headerCenter,
  headerMenu,
  headerRight,
  headerActions,
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
  const { props: contextProps } = useLayoutContext();

  const resolvedPreferencesButtonPosition =
    preferencesButtonPosition ?? contextProps.preferencesButtonPosition ?? 'auto';
  
  // 偏好设置抽屉状态
  const [showPreferencesDrawer, setShowPreferencesDrawer] = useState(false);

  // 移动端自动折叠侧边栏
  useEffect(() => {
    if (isMobile && !state.sidebarCollapsed) {
      setState((prev) => ({ ...prev, sidebarCollapsed: true }));
    }
  }, [isMobile, state.sidebarCollapsed, setState]);

  // 打开偏好设置
  const openPreferences = () => {
    setShowPreferencesDrawer(true);
    onPreferencesOpen?.();
  };

  // 关闭偏好设置
  const closePreferences = () => {
    setShowPreferencesDrawer(false);
    onPreferencesClose?.();
  };

  // ============================================================
  // 水平菜单相关逻辑
  // ============================================================
  
  // 是否显示顶部导航菜单
  const showHeaderMenu = useMemo(() => {
    return computed.isHeaderNav || computed.isMixedNav || computed.isHeaderMixedNav;
  }, [computed.isHeaderNav, computed.isMixedNav, computed.isHeaderMixedNav]);

  // 顶部导航菜单数据
  const headerMenus = useMemo(() => {
    if (!contextProps.menus) return [];
    
    // header-nav 模式：显示完整菜单树
    if (computed.isHeaderNav) {
      return contextProps.menus;
    }
    
    // mixed-nav、header-mixed-nav 模式：只显示顶级菜单
    if (computed.isMixedNav || computed.isHeaderMixedNav) {
      return contextProps.menus.map(item => ({
        ...item,
        children: undefined,
      }));
    }
    
    return [];
  }, [contextProps.menus, computed.isHeaderNav, computed.isMixedNav, computed.isHeaderMixedNav]);

  const headerMenuIndex = useMemo(
    () => buildMenuPathIndex(contextProps.menus || []),
    [contextProps.menus]
  );

  // 顶部导航菜单激活 key
  const headerActiveKey = useMemo(() => {
    if (contextProps.activeMenuKey) return contextProps.activeMenuKey;
    
    const path = contextProps.currentPath;
    if (!path || !headerMenus.length) return undefined;
    
    let menu =
      headerMenuIndex.byPath.get(path) ??
      headerMenuIndex.byKey.get(path);
    if (!menu) {
      for (const item of headerMenuIndex.pathItems) {
        if (item.path && path.startsWith(item.path)) {
          menu = item;
          break;
        }
      }
    }
    if (!menu) return undefined;
    const chain =
      (menu.key ? headerMenuIndex.chainByKey.get(menu.key) : undefined) ??
      (menu.path ? headerMenuIndex.chainByPath.get(menu.path) : undefined) ??
      [];
    if (computed.isMixedNav || computed.isHeaderMixedNav) {
      return chain[0];
    }
    return menu.key;
  }, [contextProps.activeMenuKey, contextProps.currentPath, headerMenuIndex, headerMenus.length, computed.isMixedNav, computed.isHeaderMixedNav]);

  // 菜单对齐方式
  const headerMenuAlign = contextProps.header?.menuAlign || 'start';
  
  // 菜单主题（转换 auto 为 light）
  const headerMenuTheme = (contextProps.headerTheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';

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
            left={headerLeft || (contextProps.breadcrumb?.enable !== false ? <Breadcrumb showIcon={contextProps.breadcrumb?.showIcon} showHome={contextProps.breadcrumb?.showHome} /> : undefined)}
            center={headerCenter}
            menu={headerMenu || (showHeaderMenu && headerMenus.length > 0 ? (
              <HorizontalMenu
                menus={headerMenus}
                activeKey={headerActiveKey}
                align={headerMenuAlign}
                theme={headerMenuTheme}
              />
            ) : undefined)}
            right={headerRight}
            actions={
              headerActions || (
                <HeaderToolbar
                  onOpenPreferences={openPreferences}
                  showPreferencesButton={showPreferencesButton}
                  preferencesButtonPosition={resolvedPreferencesButtonPosition}
                />
              )
            }
            extra={headerExtra}
          />
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
        {showPreferencesButton && resolvedPreferencesButtonPosition === 'fixed' && (
          <button
            className="layout-preferences-button"
            title="偏好设置"
            onClick={openPreferences}
          >
            {preferencesButtonIcon || <SettingsIcon />}
          </button>
        )}
      </div>

      {/* 偏好设置抽屉（内置） */}
      <PreferencesDrawer
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
  // 从偏好设置获取配置
  const [preferencesProps, setPreferencesProps] = useState<Partial<BasicLayoutProps>>(() => {
    if (preferencesManager) {
      const prefs = preferencesManager.getPreferences();
      return mapPreferencesToLayoutProps(prefs);
    }
    return {};
  });

  // 订阅偏好设置变化
  // 注意：preferencesManager 是模块级变量，不会变化，所以不需要作为依赖
  useEffect(() => {
    if (!preferencesManager) return;

    const unsubscribe = preferencesManager.subscribe(() => {
      const prefs = preferencesManager.getPreferences();
      setPreferencesProps(mapPreferencesToLayoutProps(prefs));
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    locale = 'zh-CN',
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
    onThemeToggle,
    onLocaleChange,
    onLockScreen,
    onLogout,
    onPanelCollapse: (collapsed: boolean) => {
      // 同步更新偏好设置
      preferencesManager?.setPreferences({ panel: { collapsed } });
      onPanelCollapse?.(collapsed);
    },
    onGlobalSearch,
    onRefresh,
  }), [
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
  ]);

  return (
    <PreferencesProvider>
      <LayoutProvider
        props={layoutProps}
        events={events}
        locale={locale}
        customMessages={customMessages}
      >
        <ErrorBoundary resetKey={currentPath ?? locale}>
          <LayoutInner {...props} />
        </ErrorBoundary>
      </LayoutProvider>
    </PreferencesProvider>
  );
}
