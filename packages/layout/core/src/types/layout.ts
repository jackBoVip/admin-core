/**
 * 布局组件类型定义
 * @description 定义布局组件的 Props、插槽、事件等
 */

import type {
  AccessModeType,
  AuthPageLayoutType,
  BreadcrumbPreferences,
  BuiltinThemeType,
  ContentCompactType,
  CopyrightPreferences,
  FooterPreferences,
  HeaderPreferences,
  LayoutType,
  LoginExpiredModeType,
  LogoPreferences,
  NavigationPreferences,
  PanelPreferences,
  Preferences,
  PreferencesButtonPositionType,
  ShortcutKeyPreferences,
  SidebarPreferences,
  SupportedLanguagesType,
  TabbarPreferences,
  ThemeModeType,
  TransitionPreferences,
  WidgetPreferences,
} from '@admin-core/preferences';

/**
 * 菜单项定义
 * @description 完整的菜单类型，包含路由、权限、缓存等配置
 */
export interface MenuItem {
  // ========== 基础配置 ==========
  /** 唯一标识（通常与路由 name 一致） */
  key: string;
  /** 菜单名称（支持国际化 key） */
  name: string;
  /** 菜单图标 */
  icon?: string;
  /** 子菜单 */
  children?: MenuItem[];

  // ========== 路由配置 ==========
  /** 路由路径 */
  path?: string;
  /** 路由重定向 */
  redirect?: string;
  /** 路由组件路径（用于动态导入） */
  component?: string;
  /** 路由参数 */
  params?: Record<string, string | number>;
  /** 路由查询参数 */
  query?: Record<string, string | number>;

  // ========== 显示配置 ==========
  /** 是否在菜单中隐藏 */
  hidden?: boolean;
  /** 是否在面包屑中隐藏 */
  hideInBreadcrumb?: boolean;
  /** 是否在标签栏中隐藏 */
  hideInTab?: boolean;
  /** 是否禁用 */
  disabled?: boolean;

  // ========== 徽标配置 ==========
  /** 徽标数量 */
  badge?: number | string;
  /** 徽标类型 */
  badgeType?: 'danger' | 'default' | 'primary' | 'success' | 'warning';
  /** 徽标是否显示为点 */
  badgeDot?: boolean;

  // ========== 外链配置 ==========
  /** 外链地址（设置后点击会跳转到外链） */
  externalLink?: string;
  /** 是否新窗口打开（外链默认 true） */
  openInNewWindow?: boolean;
  /** iframe 嵌入地址（在内容区内嵌 iframe） */
  iframeSrc?: string;

  // ========== 缓存配置 ==========
  /** 缓存名称（用于 keep-alive，不设置则使用 key） */
  cacheName?: string;
  /** 是否缓存页面（默认跟随全局配置） */
  keepAlive?: boolean;
  /** 最大缓存实例数 */
  maxKeepAliveCount?: number;

  // ========== 标签栏配置 ==========
  /** 是否固定在标签栏（不可关闭） */
  affix?: boolean;
  /** 标签栏排序（越小越靠前） */
  affixOrder?: number;

  // ========== 权限配置 ==========
  /** 需要的角色（满足其一即可） */
  roles?: string[];
  /** 需要的权限（满足其一即可） */
  permissions?: string[];
  /** 是否忽略权限检查 */
  ignoreAuth?: boolean;

  // ========== 页面配置 ==========
  /** 页面标题（不设置则使用 name） */
  title?: string;
  /** 是否全屏显示（隐藏侧边栏、顶栏等） */
  fullScreen?: boolean;
  /** 是否显示页脚 */
  showFooter?: boolean;

  // ========== 元数据 ==========
  /** 自定义元数据 */
  meta?: Record<string, unknown>;
}

/**
 * 路由导航函数类型
 */
export type RouterNavigateFunction = (
  path: string,
  options?: {
    replace?: boolean;
    params?: Record<string, string | number>;
    query?: Record<string, string | number>;
  }
) => void | Promise<void>;

/**
 * 路由配置
 */
export interface RouterConfig {
  /** 路由导航函数 */
  navigate: RouterNavigateFunction;
  /** 当前路径（支持响应式对象或普通字符串） */
  currentPath: string | { value: string };
  /** 路由模式 */
  mode?: 'hash' | 'history';
}

/**
 * 标签项定义
 */
export interface TabItem {
  /** 唯一标识 */
  key: string;
  /** 标签名称（支持国际化 key） */
  name: string;
  /** 标签图标 */
  icon?: string;
  /** 路由路径 */
  path: string;
  /** 是否可关闭 */
  closable?: boolean;
  /** 是否固定 */
  affix?: boolean;
  /** 缓存名称（用于 keep-alive） */
  cacheName?: string;
  /** 元数据 */
  meta?: Record<string, unknown>;
}

/**
 * 面包屑项定义
 */
export interface BreadcrumbItem {
  /** 唯一标识 */
  key: string;
  /** 面包屑名称（支持国际化 key） */
  name: string;
  /** 面包屑图标 */
  icon?: string;
  /** 路由路径 */
  path?: string;
  /** 是否可点击 */
  clickable?: boolean;
}

/**
 * 用户信息定义
 */
export interface UserInfo {
  /** 用户 ID */
  id: string | number;
  /** 用户名 */
  username: string;
  /** 显示名称 */
  displayName?: string;
  /** 头像 */
  avatar?: string;
  /** 角色列表 */
  roles?: string[];
  /** 额外信息 */
  [key: string]: unknown;
}

/**
 * 通知项定义
 */
export interface NotificationItem {
  /** 唯一标识 */
  id: string | number;
  /** 标题 */
  title: string;
  /** 描述 */
  description?: string;
  /** 图标 */
  icon?: string;
  /** 类型 */
  type?: 'error' | 'info' | 'success' | 'warning';
  /** 时间 */
  time?: Date | string;
  /** 是否已读 */
  read?: boolean;
  /** 点击处理 */
  onClick?: () => void;
}

/**
 * 布局区域可见性配置
 */
export interface LayoutVisibility {
  /** 顶栏 */
  header?: boolean;
  /** 侧边栏 */
  sidebar?: boolean;
  /** 标签栏 */
  tabbar?: boolean;
  /** 页脚 */
  footer?: boolean;
  /** 面包屑 */
  breadcrumb?: boolean;
  /** 功能区 */
  panel?: boolean;
  /** Logo */
  logo?: boolean;
}

/**
 * 布局区域禁用配置
 */
export interface LayoutDisabled {
  /** 顶栏折叠按钮 */
  headerCollapseButton?: boolean;
  /** 侧边栏折叠按钮 */
  sidebarCollapseButton?: boolean;
  /** 标签栏拖拽 */
  tabbarDraggable?: boolean;
  /** 标签栏关闭 */
  tabbarClose?: boolean;
  /** 功能区折叠按钮 */
  panelCollapseButton?: boolean;
}

/**
 * 小部件配置（扩展 WidgetPreferences）
 */
export interface LayoutWidgetConfig extends Partial<WidgetPreferences> {
  /** 用户下拉菜单 */
  userDropdown?: boolean;
  /** 返回顶部 */
  backToTop?: boolean;
  /** 偏好设置按钮 */
  preferencesButton?: boolean;
}

/**
 * 自动标签配置
 */
export interface AutoTabConfig {
  /** 启用自动标签（从菜单生成） */
  enabled?: boolean;
  /** 固定标签的菜单 key 列表 */
  affixKeys?: string[];
  /** 最大标签数量（0 表示不限制） */
  maxCount?: number;
  /** 持久化存储 key（用于刷新保留） */
  persistKey?: string;
}

/**
 * 自动面包屑配置
 */
export interface AutoBreadcrumbConfig {
  /** 启用自动面包屑（从菜单生成） */
  enabled?: boolean;
  /** 显示首页 */
  showHome?: boolean;
  /** 首页路径 */
  homePath?: string;
  /** 首页名称（支持国际化 key） */
  homeName?: string;
  /** 首页图标 */
  homeIcon?: string;
}

/**
 * 水印配置
 */
export interface WatermarkConfig {
  /** 启用水印 */
  enable?: boolean;
  /** 水印内容 */
  content?: string;
  /** 水印角度 (度) */
  angle?: number;
  /** 是否附加日期 */
  appendDate?: boolean;
  /** 字体大小 (px) */
  fontSize?: number;
  /** 字体颜色 */
  fontColor?: string;
  /** 透明度 (0-1) */
  opacity?: number;
  /** 水印间距 */
  gap?: [number, number];
  /** 水印偏移 */
  offset?: [number, number];
  /** z-index */
  zIndex?: number;
}

/**
 * 锁屏配置
 */
export interface LockScreenConfig {
  /** 是否已锁定 */
  isLocked?: boolean;
  /** 锁屏密码哈希值 */
  password?: string;
  /** 锁屏背景图 URL */
  backgroundImage?: string;
  /** 自动锁屏时间（分钟），0 表示禁用 */
  autoLockTime?: number;
  /** 锁屏时显示的用户信息 */
  showUserInfo?: boolean;
  /** 锁屏时显示时钟 */
  showClock?: boolean;
  /** 锁屏时显示日期 */
  showDate?: boolean;
}

/**
 * 主题配置
 */
export interface ThemeConfig {
  /** 主题模式 */
  mode?: ThemeModeType;
  /** 内置主题类型 */
  builtinType?: BuiltinThemeType;
  /** 主色（OKLCH 格式） */
  colorPrimary?: string;
  /** 字体缩放比例 */
  fontScale?: number;
  /** 圆角 (rem) */
  radius?: string;
  /** 半深色顶栏 */
  semiDarkHeader?: boolean;
  /** 半深色侧边栏 */
  semiDarkSidebar?: boolean;
  /** 浅色模式背景跟随主题色 */
  colorFollowPrimaryLight?: boolean;
  /** 深色模式背景跟随主题色 */
  colorFollowPrimaryDark?: boolean;
  /** 灰色模式（哀悼模式） */
  colorGrayMode?: boolean;
  /** 色弱模式 */
  colorWeakMode?: boolean;
}

/**
 * 检查更新配置
 */
export interface CheckUpdatesConfig {
  /** 启用检查更新 */
  enable?: boolean;
  /** 轮询间隔（分钟），0 表示禁用 */
  interval?: number;
  /** 更新提示类型 */
  notifyType?: 'dialog' | 'notification' | 'silent';
}

/**
 * 基础布局 Props
 */
export interface BasicLayoutProps {
  // ========== 应用配置（AppPreferences 完整集成）==========
  /** 应用名称 */
  appName?: string;
  /** 布局类型 */
  layout?: LayoutType;
  /** 是否移动端（自动检测） */
  isMobile?: boolean;
  /** 全局 z-index 基准值 */
  zIndex?: number;
  /** 紧凑模式（全局） */
  compact?: boolean;
  /** 动态标题（根据路由变化） */
  dynamicTitle?: boolean;
  /** 默认头像 URL */
  defaultAvatar?: string;
  /** 默认首页路径 */
  defaultHomePath?: string;
  /** 权限模式 */
  accessMode?: AccessModeType;
  /** 登录注册页面布局 */
  authPageLayout?: AuthPageLayoutType;
  /** 登录过期处理模式 */
  loginExpiredMode?: LoginExpiredModeType;
  /** 语言 */
  locale?: SupportedLanguagesType;
  /** 启用偏好设置面板 */
  enablePreferences?: boolean;
  /** 偏好设置面板导航栏吸顶 */
  enableStickyPreferencesNav?: boolean;
  /** 启用 RefreshToken */
  enableRefreshToken?: boolean;

  // ========== 主题配置（ThemePreferences 完整集成）==========
  /** 主题配置 */
  theme?: ThemeConfig;

  // ========== 水印配置 ==========
  /** 水印配置 */
  watermark?: WatermarkConfig;

  // ========== 锁屏配置（LockScreenPreferences 完整集成）==========
  /** 锁屏配置 */
  lockScreen?: LockScreenConfig;

  // ========== 检查更新配置 ==========
  /** 检查更新配置 */
  checkUpdates?: CheckUpdatesConfig;

  // ========== 顶栏配置（HeaderPreferences 完整集成）==========
  /** 顶栏配置 */
  header?: Partial<HeaderPreferences>;
  /** 顶栏主题（覆盖 theme.mode） */
  headerTheme?: ThemeModeType;
  /** 半深色顶栏（覆盖 theme.semiDarkHeader） */
  semiDarkHeader?: boolean;

  // ========== 侧边栏配置（SidebarPreferences 完整集成）==========
  /** 侧边栏配置 */
  sidebar?: Partial<SidebarPreferences>;
  /** 侧边栏主题（覆盖 theme.mode） */
  sidebarTheme?: ThemeModeType;
  /** 半深色侧边栏（覆盖 theme.semiDarkSidebar） */
  semiDarkSidebar?: boolean;

  // ========== 标签栏配置（TabbarPreferences 完整集成）==========
  /** 标签栏配置 */
  tabbar?: Partial<TabbarPreferences>;
  /** 自动标签配置（从菜单生成） */
  autoTab?: AutoTabConfig;

  // ========== 内容区配置 ==========
  /** 内容紧凑模式 */
  contentCompact?: ContentCompactType;
  /** 内容紧凑宽度 (px) */
  contentCompactWidth?: number;
  /** 内容内边距 (px) */
  contentPadding?: number;
  /** 内容顶部内边距 (px) */
  contentPaddingTop?: number;
  /** 内容底部内边距 (px) */
  contentPaddingBottom?: number;
  /** 内容左侧内边距 (px) */
  contentPaddingLeft?: number;
  /** 内容右侧内边距 (px) */
  contentPaddingRight?: number;

  // ========== 页脚配置（FooterPreferences 完整集成）==========
  /** 页脚配置 */
  footer?: Partial<FooterPreferences>;

  // ========== 面包屑配置（BreadcrumbPreferences 完整集成）==========
  /** 面包屑配置 */
  breadcrumb?: Partial<BreadcrumbPreferences>;
  /** 自动面包屑配置（从菜单生成） */
  autoBreadcrumb?: AutoBreadcrumbConfig;

  // ========== 导航配置（NavigationPreferences 完整集成）==========
  /** 导航配置 */
  navigation?: Partial<NavigationPreferences>;

  // ========== 功能区配置（PanelPreferences 完整集成）==========
  /** 功能区配置 */
  panel?: Partial<PanelPreferences>;

  // ========== Logo 配置（LogoPreferences 完整集成）==========
  /** Logo 配置 */
  logo?: Partial<LogoPreferences>;

  // ========== 版权配置（CopyrightPreferences 完整集成）==========
  /** 版权配置 */
  copyright?: Partial<CopyrightPreferences>;

  // ========== 过渡动画配置（TransitionPreferences 完整集成）==========
  /** 过渡动画配置 */
  transition?: Partial<TransitionPreferences>;

  // ========== 快捷键配置（ShortcutKeyPreferences 完整集成）==========
  /** 快捷键配置 */
  shortcutKeys?: Partial<ShortcutKeyPreferences>;

  // ========== 小部件配置（WidgetPreferences 完整集成）==========
  /** 小部件配置 */
  widgets?: LayoutWidgetConfig;
  /** 偏好设置按钮位置 */
  preferencesButtonPosition?: PreferencesButtonPositionType;

  // ========== 可见性控制 ==========
  /** 区域可见性 */
  visibility?: LayoutVisibility;
  /** 区域禁用状态 */
  disabled?: LayoutDisabled;

  // ========== 路由配置（内置路由处理）==========
  /**
   * 路由导航函数
   * @description 传入后，布局组件将自动处理菜单、标签、面包屑的路由跳转
   * @example
   * // Vue Router
   * :router="{ navigate: (path, opts) => router.push({ path, ...opts }), currentPath: route.path }"
   * 
   * // React Router
   * router={{ navigate: (path) => navigate(path), currentPath: location.pathname }}
   */
  router?: RouterConfig;

  // ========== 数据 ==========
  /** 
   * 菜单数据
   * @description 完整的菜单配置，包含路由、权限、缓存等
   */
  menus?: MenuItem[];
  /** 
   * 当前路径
   * @deprecated 请使用 router.currentPath
   */
  currentPath?: string;
  /** 当前激活菜单 key */
  activeMenuKey?: string;
  /** 标签数据（手动模式，autoTab.enabled=false 时使用） */
  tabs?: TabItem[];
  /** 当前激活标签 key */
  activeTabKey?: string;
  /** 面包屑数据（手动模式，autoBreadcrumb.enabled=false 时使用） */
  breadcrumbs?: BreadcrumbItem[];
  /** 用户信息 */
  userInfo?: UserInfo;
  /** 通知列表 */
  notifications?: NotificationItem[];
  /** 未读通知数量 */
  unreadCount?: number;

  // ========== 直接传入完整 Preferences 对象（可选）==========
  /** 
   * 直接传入完整的 Preferences 对象
   * @description 如果传入此属性，将自动映射到上述所有配置项
   * 优先级：单独配置项 > preferences 对象
   */
  preferences?: Partial<Preferences>;
}

/**
 * 布局事件
 */
export interface LayoutEvents {
  /** 侧边栏折叠状态变化 */
  onSidebarCollapse?: (collapsed: boolean) => void;
  /** 菜单选择 */
  onMenuSelect?: (item: MenuItem, key: string) => void;
  /** 标签选择 */
  onTabSelect?: (item: TabItem, key: string) => void;
  /** 标签关闭 */
  onTabClose?: (item: TabItem, key: string) => void;
  /** 标签全部关闭 */
  onTabCloseAll?: () => void;
  /** 标签关闭其他 */
  onTabCloseOther?: (exceptKey: string) => void;
  /** 标签刷新 */
  onTabRefresh?: (item: TabItem, key: string) => void;
  /** 标签栏最大化切换 */
  onTabMaximize?: (isMaximized: boolean) => void;
  /** 面包屑点击 */
  onBreadcrumbClick?: (item: BreadcrumbItem, key: string) => void;
  /** 用户下拉菜单选择 */
  onUserMenuSelect?: (key: string) => void;
  /** 通知点击 */
  onNotificationClick?: (item: NotificationItem) => void;
  /** 全屏切换 */
  onFullscreenToggle?: (isFullscreen: boolean) => void;
  /** 主题切换 */
  onThemeToggle?: (theme: ThemeModeType) => void;
  /** 语言切换 */
  onLocaleChange?: (locale: string) => void;
  /** 锁屏 */
  onLockScreen?: () => void;
  /** 登出 */
  onLogout?: () => void;
  /** 功能区折叠状态变化 */
  onPanelCollapse?: (collapsed: boolean) => void;
  /** 全局搜索 */
  onGlobalSearch?: (keyword: string) => void;
  /** 刷新按钮点击 */
  onRefresh?: () => void;
}

/**
 * 布局插槽名称
 */
export type LayoutSlotName =
  // 顶栏插槽
  | 'header'
  | 'header-left'
  | 'header-center'
  | 'header-right'
  | 'header-logo'
  | 'header-menu'
  | 'header-actions'
  | 'header-extra'
  // 侧边栏插槽
  | 'sidebar'
  | 'sidebar-logo'
  | 'sidebar-menu'
  | 'sidebar-footer'
  | 'sidebar-extra'
  | 'sidebar-mixed-menu'
  | 'sidebar-mixed-extra'
  // 标签栏插槽
  | 'tabbar'
  | 'tabbar-left'
  | 'tabbar-right'
  | 'tabbar-extra'
  // 内容区插槽
  | 'content'
  | 'content-header'
  | 'content-footer'
  | 'content-overlay'
  // 页脚插槽
  | 'footer'
  | 'footer-left'
  | 'footer-center'
  | 'footer-right'
  // 面包屑插槽
  | 'breadcrumb'
  | 'breadcrumb-extra'
  // 功能区插槽
  | 'panel'
  | 'panel-header'
  | 'panel-content'
  | 'panel-footer'
  // 小部件插槽
  | 'widget-fullscreen'
  | 'widget-theme'
  | 'widget-locale'
  | 'widget-notification'
  | 'widget-user'
  | 'widget-search'
  | 'widget-refresh'
  | 'widget-lock'
  | 'widget-timezone'
  // 其他插槽
  | 'extra'
  | 'preferences-button';

/**
 * 布局状态（内部使用）
 */
export interface LayoutState {
  /** 侧边栏折叠状态 */
  sidebarCollapsed: boolean;
  /** 侧边栏悬停展开中 */
  sidebarExpandOnHovering: boolean;
  /** 侧边栏扩展区域可见 */
  sidebarExtraVisible: boolean;
  /** 侧边栏扩展区域折叠（仅图标列可见） */
  sidebarExtraCollapsed: boolean;
  /** 侧边栏扩展区域固定（不自动隐藏） */
  sidebarExpandOnHover: boolean;
  /** 顶栏隐藏状态（自动模式） */
  headerHidden: boolean;
  /** 功能区折叠状态 */
  panelCollapsed: boolean;
  /** 是否全屏 */
  isFullscreen: boolean;
  /** 当前展开的菜单 keys */
  openMenuKeys: string[];
  /** 内容区域滚动位置 */
  contentScrollTop: number;
}

/**
 * 布局上下文
 */
export interface LayoutContext {
  /** 布局 Props */
  props: BasicLayoutProps;
  /** 布局状态 */
  state: LayoutState;
  /** 布局事件 */
  events: LayoutEvents;
  /** 翻译函数 */
  t: (key: string, params?: Record<string, unknown>) => string;
  /** 切换侧边栏折叠 */
  toggleSidebarCollapse: () => void;
  /** 切换功能区折叠 */
  togglePanelCollapse: () => void;
  /** 设置展开的菜单 */
  setOpenMenuKeys: (keys: string[]) => void;
}

/**
 * 布局计算属性
 */
export interface LayoutComputed {
  /** 当前布局类型（响应式） */
  currentLayout: LayoutType;
  /** 是否显示侧边栏 */
  showSidebar: boolean;
  /** 是否显示顶栏 */
  showHeader: boolean;
  /** 是否显示标签栏 */
  showTabbar: boolean;
  /** 是否显示页脚 */
  showFooter: boolean;
  /** 是否显示面包屑 */
  showBreadcrumb: boolean;
  /** 是否显示功能区 */
  showPanel: boolean;
  /** 是否全屏内容模式 */
  isFullContent: boolean;
  /** 是否侧边混合导航 */
  isSidebarMixedNav: boolean;
  /** 是否顶部导航 */
  isHeaderNav: boolean;
  /** 是否混合导航 */
  isMixedNav: boolean;
  /** 是否顶部混合导航 */
  isHeaderMixedNav: boolean;
  /** 侧边栏实际宽度 */
  sidebarWidth: number;
  /** 顶栏实际高度 */
  headerHeight: number;
  /** 标签栏实际高度 */
  tabbarHeight: number;
  /** 页脚实际高度 */
  footerHeight: number;
  /** 功能区实际宽度 */
  panelWidth: number;
  /** 侧边栏主题（计算后，不含 auto） */
  sidebarTheme: 'light' | 'dark';
  /** 顶栏主题（计算后，不含 auto） */
  headerTheme: 'light' | 'dark';
  /** 主内容区域样式 */
  mainStyle: {
    marginLeft: string;
    marginRight: string;
    marginTop: string;
    width: string;
  };
}
