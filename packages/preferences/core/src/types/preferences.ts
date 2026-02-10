/**
 * 偏好设置接口定义
 * @description 完整的偏好设置类型定义
 */

import type {
  AccessModeType,
  AuthPageLayoutType,
  BreadcrumbStyleType,
  ContentCompactType,
  LayoutHeaderMenuAlignType,
  LayoutHeaderModeType,
  LayoutType,
  LoginExpiredModeType,
  NavigationStyleType,
  PreferencesButtonPositionType,
  SupportedLanguagesType,
  TabsStyleType,
} from './layout';
import type { BuiltinThemeType, PageTransitionType, ThemeModeType } from './theme';

/**
 * 应用偏好设置
 */
export interface AppPreferences {
  /** 权限模式 */
  accessMode: AccessModeType;
  /** 登录注册页面布局 */
  authPageLayout: AuthPageLayoutType;
  /** 检查更新轮询时间（分钟），0 表示禁用 */
  checkUpdatesInterval: number;
  /** 浅色模式背景跟随主题色 */
  colorFollowPrimaryLight: boolean;
  /** 深色模式背景跟随主题色 */
  colorFollowPrimaryDark: boolean;
  /** 灰色模式（哀悼模式） */
  colorGrayMode: boolean;
  /** 色弱模式（无障碍） */
  colorWeakMode: boolean;
  /** 紧凑模式 */
  compact: boolean;
  /** 内容区域宽度模式 */
  contentCompact: ContentCompactType;
  /** 内容紧凑宽度 (px) */
  contentCompactWidth: number;
  /** 内容内边距 (px) - 统一设置 */
  contentPadding: number;
  /** 内容底部内边距 (px) */
  contentPaddingBottom: number;
  /** 内容左侧内边距 (px) */
  contentPaddingLeft: number;
  /** 内容右侧内边距 (px) */
  contentPaddingRight: number;
  /** 内容顶部内边距 (px) */
  contentPaddingTop: number;
  /** 默认头像 URL */
  defaultAvatar: string;
  /** 默认首页路径 */
  defaultHomePath: string;
  /** 动态标题（根据路由变化） */
  dynamicTitle: boolean;
  /** 启用检查更新 */
  enableCheckUpdates: boolean;
  /** 启用偏好设置面板 */
  enablePreferences: boolean;
  /** 启用 RefreshToken 机制 */
  enableRefreshToken: boolean;
  /** 偏好设置面板导航栏吸顶 */
  enableStickyPreferencesNavigationBar: boolean;
  /** 是否移动端（自动检测） */
  isMobile: boolean;
  /** 布局模式 */
  layout: LayoutType;
  /** 语言 */
  locale: SupportedLanguagesType;
  /** 登录过期处理模式 */
  loginExpiredMode: LoginExpiredModeType;
  /** 应用名称 */
  name: string;
  /** 偏好设置按钮位置 */
  preferencesButtonPosition: PreferencesButtonPositionType;
  /** 水印 */
  watermark: boolean;
  /** 水印内容 */
  watermarkContent: string;
  /** 水印角度 (度) */
  watermarkAngle: number;
  /** 水印是否附加日期 */
  watermarkAppendDate: boolean;
  /** 水印字体大小 (px) */
  watermarkFontSize: number;
  /** 全局 z-index 基准值 */
  zIndex: number;
}

/**
 * 面包屑偏好设置
 */
export interface BreadcrumbPreferences {
  /** 启用面包屑 */
  enable: boolean;
  /** 只有一个时隐藏 */
  hideOnlyOne: boolean;
  /** 显示首页 */
  showHome: boolean;
  /** 显示图标 */
  showIcon: boolean;
  /** 样式类型 */
  styleType: BreadcrumbStyleType;
}

/**
 * 版权偏好设置
 */
export interface CopyrightPreferences {
  /** 公司名称 */
  companyName: string;
  /** 公司网站链接 */
  companySiteLink: string;
  /** 版权年份 */
  date: string;
  /** 启用版权信息 */
  enable: boolean;
  /** ICP 备案号 */
  icp: string;
  /** ICP 链接 */
  icpLink: string;
  /** 在设置面板中显示 */
  settingShow?: boolean;
}

/**
 * 页脚偏好设置
 */
export interface FooterPreferences {
  /** 启用页脚 */
  enable: boolean;
  /** 固定页脚 */
  fixed: boolean;
  /** 页脚高度 (px) */
  height: number;
}

/**
 * 顶栏偏好设置
 */
export interface HeaderPreferences {
  /** 启用顶栏 */
  enable: boolean;
  /** 顶栏高度 (px) */
  height: number;
  /** 顶栏右侧图标按钮尺寸 (px) */
  widgetSize: number;
  /** 顶栏图标大小 (px) */
  widgetIconSize: number;
  /** 顶栏文字大小 (px) */
  widgetFontSize: number;
  /** 顶栏搜索快捷键字体大小 (px) */
  searchKbdFontSize: number;
  /** 隐藏顶栏（CSS 隐藏，用于最大化内容区） */
  hidden: boolean;
  /** 菜单对齐方式 */
  menuAlign: LayoutHeaderMenuAlignType;
  /**
   * 菜单启动器模式
   * @description 将顶栏菜单折叠为一个启动器按钮，点击后在内容区弹出菜单面板
   * 适用于菜单项较多的场景，带有 macOS 风格的缩放动画
   */
  menuLauncher: boolean;
  /** 顶栏模式 */
  mode: LayoutHeaderModeType;
}

/**
 * Logo 偏好设置
 */
export interface LogoPreferences {
  /** 启用 Logo */
  enable: boolean;
  /** 图片适应方式 */
  fit: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  /** Logo 图片 URL */
  source: string;
  /** 暗色模式 Logo URL（可选） */
  sourceDark?: string;
}

/**
 * 导航偏好设置
 */
export interface NavigationPreferences {
  /** 手风琴模式（同级只展开一个） */
  accordion: boolean;
  /** 分割菜单（仅 mixed-nav 模式） */
  split: boolean;
  /** 导航风格 */
  styleType: NavigationStyleType;
}

/**
 * 侧边栏偏好设置
 */
export interface SidebarPreferences {
  /** 点击目录自动激活子菜单 */
  autoActivateChild: boolean;
  /** 折叠状态 */
  collapsed: boolean;
  /** 显示折叠按钮 */
  collapsedButton: boolean;
  /** 折叠时显示标题 */
  collapsedShowTitle: boolean;
  /** 折叠宽度 (px) */
  collapseWidth: number;
  /** 启用侧边栏 */
  enable: boolean;
  /** 悬停时展开 */
  expandOnHover: boolean;
  /** 扩展区域折叠 */
  extraCollapse: boolean;
  /** 扩展区域折叠宽度 (px) */
  extraCollapsedWidth: number;
  /** 显示固定按钮 */
  fixedButton: boolean;
  /** 隐藏侧边栏（CSS 隐藏，用于最大化内容区） */
  hidden: boolean;
  /** 混合模式宽度 (px) */
  mixedWidth: number;
  /** 展开宽度 (px) */
  width: number;
}

/**
 * 快捷键偏好设置
 */
export interface ShortcutKeyPreferences {
  /** 启用全局快捷键 */
  enable: boolean;
  /** 锁屏快捷键 */
  globalLockScreen: boolean;
  /** 登出快捷键 */
  globalLogout: boolean;
  /** 打开偏好设置快捷键 */
  globalPreferences: boolean;
  /** 全局搜索快捷键 */
  globalSearch: boolean;
}

/**
 * 标签栏偏好设置
 */
export interface TabbarPreferences {
  /** 可拖拽排序 */
  draggable: boolean;
  /** 启用标签栏 */
  enable: boolean;
  /** 标签栏高度 (px) */
  height: number;
  /** 页面缓存 (keep-alive) */
  keepAlive: boolean;
  /** 最大标签数量，0 表示不限制 */
  maxCount: number;
  /** 中键点击关闭 */
  middleClickToClose: boolean;
  /** 持久化标签（刷新保留） */
  persist: boolean;
  /** 显示图标 */
  showIcon: boolean;
  /** 显示最大化按钮 */
  showMaximize: boolean;
  /** 显示更多按钮 */
  showMore: boolean;
  /** 标签样式 */
  styleType: TabsStyleType;
  /** 响应鼠标滚轮 */
  wheelable: boolean;
}

/**
 * 主题偏好设置
 * @description 只配置主色，其他语义色通过 OKLCH 色相旋转自动派生
 */
export interface ThemePreferences {
  /** 内置主题类型 */
  builtinType: BuiltinThemeType;
  /**
   * 主色（唯一需要配置的颜色）
   * @description 使用 OKLCH 格式，语义色自动派生
   * - success: 色相 +145° (绿色)
   * - warning: 色相 +85° (黄色)
   * - destructive: 色相 +30° (红色)
   * - info: 色相 -30° (青色)
   * @example 'oklch(0.55 0.2 250)'
   */
  colorPrimary: string;
  /**
   * 字体缩放比例
   * @description 全局字体缩放，基于基准字体大小 (16px) 进行缩放
   * - 0.8 = 80% = 12.8px
   * - 1.0 = 100% = 16px (默认)
   * - 1.2 = 120% = 19.2px
   * @example 1.0
   */
  fontScale: number;
  /** 主题模式 */
  mode: ThemeModeType;
  /** 圆角 (rem) */
  radius: string;
  /** 半深色顶栏（仅亮色模式生效） */
  semiDarkHeader: boolean;
  /** 半深色侧边栏（仅亮色模式生效） */
  semiDarkSidebar: boolean;
}

/**
 * 过渡动画偏好设置
 */
export interface TransitionPreferences {
  /** 启用页面切换动画 */
  enable: boolean;
  /** 页面加载动画 */
  loading: boolean;
  /** 动画名称 */
  name: PageTransitionType | string;
  /** 显示加载进度条 */
  progress: boolean;
}

/**
 * 小部件偏好设置
 */
export interface WidgetPreferences {
  /** 全屏按钮 */
  fullscreen: boolean;
  /** 全局搜索 */
  globalSearch: boolean;
  /** 语言切换 */
  languageToggle: boolean;
  /** 锁屏按钮 */
  lockScreen: boolean;
  /** 通知按钮 */
  notification: boolean;
  /** 刷新按钮 */
  refresh: boolean;
  /** 侧边栏切换按钮 */
  sidebarToggle: boolean;
  /** 主题切换按钮 */
  themeToggle: boolean;
  /** 时区选择 */
  timezone: boolean;
}

/**
 * 功能区位置类型
 */
export type PanelPositionType = 'left' | 'right';

/**
 * 功能区偏好设置
 * @description 全局功能面板配置，可放置在左侧或右侧
 */
export interface PanelPreferences {
  /** 启用功能区 */
  enable: boolean;
  /** 功能区位置 */
  position: PanelPositionType;
  /** 折叠状态 */
  collapsed: boolean;
  /** 显示折叠按钮 */
  collapsedButton: boolean;
  /** 展开宽度 (px) */
  width: number;
  /** 折叠宽度 (px) */
  collapsedWidth: number;
}

/**
 * 锁屏偏好设置
 */
export interface LockScreenPreferences {
  /** 是否已锁定 */
  isLocked: boolean;
  /** 锁屏密码哈希值（空字符串表示未设置） */
  password: string;
  /** 锁屏背景图 URL（空字符串表示使用默认背景） */
  backgroundImage: string;
  /** 自动锁屏时间（分钟），0 表示禁用 */
  autoLockTime: number;
}

/**
 * 完整偏好设置
 */
export interface Preferences {
  /** 应用配置 */
  app: AppPreferences;
  /** 面包屑配置 */
  breadcrumb: BreadcrumbPreferences;
  /** 版权配置 */
  copyright: CopyrightPreferences;
  /** 页脚配置 */
  footer: FooterPreferences;
  /** 顶栏配置 */
  header: HeaderPreferences;
  /** 锁屏配置 */
  lockScreen: LockScreenPreferences;
  /** Logo 配置 */
  logo: LogoPreferences;
  /** 导航配置 */
  navigation: NavigationPreferences;
  /** 功能区配置 */
  panel: PanelPreferences;
  /** 快捷键配置 */
  shortcutKeys: ShortcutKeyPreferences;
  /** 侧边栏配置 */
  sidebar: SidebarPreferences;
  /** 标签栏配置 */
  tabbar: TabbarPreferences;
  /** 主题配置 */
  theme: ThemePreferences;
  /** 过渡动画配置 */
  transition: TransitionPreferences;
  /** 小部件配置 */
  widget: WidgetPreferences;
}

/**
 * 偏好设置键名类型
 */
export type PreferencesKeys = keyof Preferences;
