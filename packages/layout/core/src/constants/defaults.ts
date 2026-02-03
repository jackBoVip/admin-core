/**
 * 布局默认配置
 * @description 所有布局配置的默认值，用户可覆盖
 */

import type {
  BasicLayoutProps,
  CheckUpdatesConfig,
  LayoutDisabled,
  LayoutState,
  LayoutVisibility,
  LayoutWidgetConfig,
  LockScreenConfig,
  ThemeConfig,
  WatermarkConfig,
} from '../types';

/**
 * 默认顶栏配置
 */
export const DEFAULT_HEADER_CONFIG = {
  enable: true,
  height: 48,
  hidden: false,
  menuAlign: 'start' as const,
  menuLauncher: false,
  mode: 'fixed' as const,
};

/**
 * 默认侧边栏配置
 */
export const DEFAULT_SIDEBAR_CONFIG = {
  autoActivateChild: false,
  collapsed: false,
  collapsedButton: true,
  collapsedShowTitle: false,
  collapseWidth: 60,
  enable: true,
  expandOnHover: false,
  extraCollapse: true,
  extraCollapsedWidth: 60,
  fixedButton: true,
  hidden: false,
  mixedWidth: 80,
  width: 210,
};

/**
 * 默认标签栏配置
 */
export const DEFAULT_TABBAR_CONFIG = {
  draggable: true,
  enable: true,
  height: 38,
  keepAlive: true,
  maxCount: 0,
  middleClickToClose: true,
  persist: true,
  showIcon: true,
  showMaximize: true,
  showMore: true,
  styleType: 'chrome' as const,
  wheelable: true,
};

/**
 * 默认页脚配置
 */
export const DEFAULT_FOOTER_CONFIG = {
  enable: false,
  fixed: true,
  height: 32,
};

/**
 * 默认面包屑配置
 */
export const DEFAULT_BREADCRUMB_CONFIG = {
  enable: true,
  hideOnlyOne: true,
  showHome: true,
  showIcon: true,
  styleType: 'normal' as const,
};

/**
 * 默认导航配置
 */
export const DEFAULT_NAVIGATION_CONFIG = {
  accordion: true,
  split: true,
  styleType: 'rounded' as const,
};

/**
 * 默认功能区配置
 */
export const DEFAULT_PANEL_CONFIG = {
  enable: false,
  position: 'right' as const,
  collapsed: false,
  collapsedButton: true,
  width: 280,
  collapsedWidth: 0,
};

/**
 * 默认 Logo 配置
 */
export const DEFAULT_LOGO_CONFIG = {
  enable: true,
  fit: 'contain' as const,
  source: '',
  sourceDark: undefined,
};

/**
 * 默认版权配置
 */
export const DEFAULT_COPYRIGHT_CONFIG = {
  companyName: '',
  companySiteLink: '',
  date: new Date().getFullYear().toString(),
  enable: false,
  icp: '',
  icpLink: '',
  settingShow: false,
};

/**
 * 默认小部件配置
 */
export const DEFAULT_WIDGET_CONFIG: LayoutWidgetConfig = {
  fullscreen: true,
  globalSearch: true,
  languageToggle: true,
  lockScreen: false,
  notification: true,
  refresh: true,
  sidebarToggle: true,
  themeToggle: true,
  timezone: false,
  userDropdown: true,
  backToTop: true,
  preferencesButton: true,
};

/**
 * 默认可见性配置
 */
export const DEFAULT_VISIBILITY_CONFIG: LayoutVisibility = {
  header: true,
  sidebar: true,
  tabbar: true,
  footer: false,
  breadcrumb: true,
  panel: false,
  logo: true,
};

/**
 * 默认过渡动画配置
 */
export const DEFAULT_TRANSITION_CONFIG = {
  enable: true,
  loading: true,
  name: 'fade-slide' as const,
  progress: true,
};

/**
 * 默认快捷键配置
 */
export const DEFAULT_SHORTCUT_KEYS_CONFIG = {
  enable: true,
  globalLockScreen: true,
  globalLogout: true,
  globalPreferences: true,
  globalSearch: true,
};

/**
 * 默认主题配置
 */
export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  mode: 'light',
  builtinType: 'default',
  colorPrimary: 'oklch(0.55 0.2 250)',
  fontScale: 1,
  radius: '0.5',
  semiDarkHeader: false,
  semiDarkSidebar: false,
  colorFollowPrimaryLight: false,
  colorFollowPrimaryDark: false,
  colorGrayMode: false,
  colorWeakMode: false,
};

/**
 * 默认水印配置
 */
export const DEFAULT_WATERMARK_CONFIG: WatermarkConfig = {
  enable: false,
  content: '',
  angle: -22,
  appendDate: false,
  fontSize: 16,
  fontColor: 'rgba(0, 0, 0, 0.15)',
  opacity: 1,
  gap: [100, 100],
  offset: [50, 50],
  zIndex: 9999,
};

/**
 * 默认锁屏配置
 */
export const DEFAULT_LOCK_SCREEN_CONFIG: LockScreenConfig = {
  isLocked: false,
  password: '',
  backgroundImage: '',
  autoLockTime: 0,
  showUserInfo: true,
  showClock: true,
  showDate: true,
};

/**
 * 默认检查更新配置
 */
export const DEFAULT_CHECK_UPDATES_CONFIG: CheckUpdatesConfig = {
  enable: false,
  interval: 0,
  notifyType: 'notification',
};

/**
 * 默认自动标签配置
 */
export const DEFAULT_AUTO_TAB_CONFIG = {
  enabled: true,
  affixKeys: [] as string[],
  maxCount: 0,
  persistKey: '',
};

/**
 * 默认自动面包屑配置
 */
export const DEFAULT_AUTO_BREADCRUMB_CONFIG = {
  enabled: true,
  showHome: true,
  homePath: '/',
  homeName: 'layout.breadcrumb.home',
  homeIcon: 'home',
};

/**
 * 默认禁用配置
 */
export const DEFAULT_DISABLED_CONFIG: LayoutDisabled = {
  headerCollapseButton: false,
  sidebarCollapseButton: false,
  tabbarDraggable: false,
  tabbarClose: false,
  panelCollapseButton: false,
};

/**
 * 默认内容区配置
 */
export const DEFAULT_CONTENT_CONFIG = {
  contentCompact: 'wide' as const,
  contentCompactWidth: 1200,
  contentPadding: 16,
  contentPaddingTop: 16,
  contentPaddingBottom: 16,
  contentPaddingLeft: 16,
  contentPaddingRight: 16,
};

/**
 * 默认布局状态
 */
export const DEFAULT_LAYOUT_STATE: LayoutState = {
  sidebarCollapsed: false,
  sidebarExpandOnHovering: false,
  sidebarExtraVisible: false,
  sidebarExtraCollapsed: false,
  sidebarExpandOnHover: false, // 默认使用弹出菜单模式
  headerHidden: false,
  panelCollapsed: false,
  isFullscreen: false,
  openMenuKeys: [],
  contentScrollTop: 0,
};

/**
 * 完整默认布局配置
 */
export const DEFAULT_LAYOUT_CONFIG: BasicLayoutProps = {
  // ========== 应用配置（AppPreferences 完整集成）==========
  appName: '',
  layout: 'sidebar-nav',
  isMobile: false,
  zIndex: 200,
  compact: false,
  dynamicTitle: true,
  defaultAvatar: '',
  defaultHomePath: '/',
  accessMode: 'frontend',
  authPageLayout: 'panel-left',
  loginExpiredMode: 'modal',
  locale: 'zh-CN',
  enablePreferences: true,
  enableStickyPreferencesNav: true,
  enableRefreshToken: false,
  // ========== 主题配置（ThemePreferences 完整集成）==========
  theme: DEFAULT_THEME_CONFIG,
  // ========== 水印配置 ==========
  watermark: DEFAULT_WATERMARK_CONFIG,
  // ========== 锁屏配置（LockScreenPreferences 完整集成）==========
  lockScreen: DEFAULT_LOCK_SCREEN_CONFIG,
  // ========== 检查更新配置 ==========
  checkUpdates: DEFAULT_CHECK_UPDATES_CONFIG,
  // ========== 顶栏配置（HeaderPreferences 完整集成）==========
  header: DEFAULT_HEADER_CONFIG,
  // headerTheme 和 sidebarTheme 不设置默认值，由 calculateLayoutComputed 根据全局主题和 semiDark 设置动态计算
  semiDarkHeader: false,
  // ========== 侧边栏配置（SidebarPreferences 完整集成）==========
  sidebar: DEFAULT_SIDEBAR_CONFIG,
  semiDarkSidebar: false,
  // ========== 标签栏配置（TabbarPreferences 完整集成）==========
  tabbar: DEFAULT_TABBAR_CONFIG,
  // ========== 自动标签/面包屑配置（默认启用）==========
  autoTab: DEFAULT_AUTO_TAB_CONFIG,
  autoBreadcrumb: DEFAULT_AUTO_BREADCRUMB_CONFIG,
  // ========== 内容区配置 ==========
  ...DEFAULT_CONTENT_CONFIG,
  // ========== 页脚配置（FooterPreferences 完整集成）==========
  footer: DEFAULT_FOOTER_CONFIG,
  // ========== 面包屑配置（BreadcrumbPreferences 完整集成）==========
  breadcrumb: DEFAULT_BREADCRUMB_CONFIG,
  // ========== 导航配置（NavigationPreferences 完整集成）==========
  navigation: DEFAULT_NAVIGATION_CONFIG,
  // ========== 功能区配置（PanelPreferences 完整集成）==========
  panel: DEFAULT_PANEL_CONFIG,
  // ========== Logo 配置（LogoPreferences 完整集成）==========
  logo: DEFAULT_LOGO_CONFIG,
  // ========== 版权配置（CopyrightPreferences 完整集成）==========
  copyright: DEFAULT_COPYRIGHT_CONFIG,
  // ========== 过渡动画配置（TransitionPreferences 完整集成）==========
  transition: DEFAULT_TRANSITION_CONFIG,
  // ========== 快捷键配置（ShortcutKeyPreferences 完整集成）==========
  shortcutKeys: DEFAULT_SHORTCUT_KEYS_CONFIG,
  // ========== 小部件配置（WidgetPreferences 完整集成）==========
  widgets: DEFAULT_WIDGET_CONFIG,
  preferencesButtonPosition: 'auto',
  // ========== 可见性/禁用配置 ==========
  visibility: DEFAULT_VISIBILITY_CONFIG,
  disabled: DEFAULT_DISABLED_CONFIG,
  // ========== 数据 ==========
  menus: [],
  tabs: [],
  breadcrumbs: [],
  notifications: [],
  unreadCount: 0,
};

/**
 * 布局类型分类
 */
export const LAYOUT_CATEGORIES = {
  /** 带顶部菜单的布局 */
  headerMenu: ['header-nav', 'mixed-nav', 'header-mixed-nav'] as const,
  /** 带侧边菜单的布局 */
  sidebarMenu: ['sidebar-nav', 'sidebar-mixed-nav', 'header-sidebar-nav'] as const,
  /** 混合导航布局 */
  mixed: ['mixed-nav', 'header-mixed-nav', 'sidebar-mixed-nav'] as const,
  /** 纯内容布局 */
  fullContent: ['full-content'] as const,
  /** 所有布局 */
  all: [
    'sidebar-nav',
    'sidebar-mixed-nav',
    'header-nav',
    'header-sidebar-nav',
    'mixed-nav',
    'header-mixed-nav',
    'full-content',
  ] as const,
};

/**
 * CSS 变量名映射
 */
export const CSS_VAR_NAMES = {
  // 尺寸
  headerHeight: '--layout-header-height',
  sidebarWidth: '--layout-sidebar-width',
  sidebarCollapseWidth: '--layout-sidebar-collapse-width',
  sidebarMixedWidth: '--layout-sidebar-mixed-width',
  tabbarHeight: '--layout-tabbar-height',
  footerHeight: '--layout-footer-height',
  panelWidth: '--layout-panel-width',
  panelCollapseWidth: '--layout-panel-collapse-width',
  contentPadding: '--layout-content-padding',
  contentPaddingTop: '--layout-content-padding-top',
  contentPaddingBottom: '--layout-content-padding-bottom',
  contentPaddingLeft: '--layout-content-padding-left',
  contentPaddingRight: '--layout-content-padding-right',
  contentCompactWidth: '--layout-content-compact-width',
  // z-index
  zIndex: '--layout-z-index',
  zIndexHeader: '--layout-z-index-header',
  zIndexSidebar: '--layout-z-index-sidebar',
  zIndexTabbar: '--layout-z-index-tabbar',
  zIndexPanel: '--layout-z-index-panel',
  zIndexOverlay: '--layout-z-index-overlay',
} as const;

/**
 * 动画持续时间（毫秒）
 */
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 200,
  slow: 300,
} as const;

/**
 * 顶栏自动隐藏触发距离（像素）
 */
export const HEADER_TRIGGER_DISTANCE = 60;

/**
 * 弹出菜单延迟时间（毫秒）
 */
export const POPUP_MENU_DELAY = {
  show: 0,
  hide: 100,
} as const;

/**
 * 响应式断点
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * 通用防抖/节流延迟时间（毫秒）
 */
export const TIMING = {
  /** 节流延迟（用于频繁触发的事件如 resize、scroll） */
  throttle: 100,
  /** 防抖延迟（用于用户输入、搜索等） */
  debounce: 300,
  /** SSR 默认窗口宽度 */
  defaultWindowWidth: 1024,
} as const;
