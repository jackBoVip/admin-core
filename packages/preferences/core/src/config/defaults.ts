/**
 * 默认偏好设置配置
 * @description
 * 设计原则：
 * 1. 所有配置项都有合理的默认值
 * 2. 禁止硬编码，所有值可通过 overrides 覆盖
 * 3. 主色使用 OKLCH 格式，语义色自动派生
 * 4. 数值单位统一（px/rem）
 */

import type { Preferences } from '../types';

/**
 * 默认主色配置
 * @description 只需配置主色，其他语义色通过 OKLCH 色相旋转自动派生
 */
export const DEFAULT_PRIMARY_COLOR = 'oklch(0.55 0.2 250)'; // 蓝色

/**
 * 快捷键配置
 * @description 定义各功能对应的快捷键组合
 */
export interface ShortcutKeyBinding {
  /** 快捷键标识 */
  key: string;
  /** 按键列表 (Windows/Linux) */
  keys: string[];
  /** 按键列表 (Mac) */
  keysMac: string[];
}

/**
 * 快捷键映射配置
 */
export const SHORTCUT_KEY_BINDINGS: Record<string, ShortcutKeyBinding> = {
  globalPreferences: {
    key: 'globalPreferences',
    keys: ['Ctrl', 'Shift', ','],
    keysMac: ['⌘', '⇧', ','],
  },
  globalSearch: {
    key: 'globalSearch',
    keys: ['Ctrl', 'K'],
    keysMac: ['⌘', 'K'],
  },
  globalLockScreen: {
    key: 'globalLockScreen',
    keys: ['Ctrl', 'Shift', 'L'],
    keysMac: ['⌘', '⇧', 'L'],
  },
  globalLogout: {
    key: 'globalLogout',
    keys: ['Ctrl', 'Shift', 'Q'],
    keysMac: ['⌘', '⇧', 'Q'],
  },
};

/**
 * 获取快捷键按键列表
 * @param key 快捷键标识
 * @param isMac 是否为 Mac 系统
 */
export function getShortcutKeys(key: string, isMac = false): string[] {
  const binding = SHORTCUT_KEY_BINDINGS[key];
  if (!binding) return [];
  return isMac ? binding.keysMac : binding.keys;
}

/**
 * 获取快捷键显示文本（兼容旧 API）
 * @param key 快捷键标识
 * @param isMac 是否为 Mac 系统
 */
export function getShortcutKeyDisplay(key: string, isMac = false): string {
  const keys = getShortcutKeys(key, isMac);
  return keys.join(' + ');
}

/**
 * 默认偏好设置
 */
export const DEFAULT_PREFERENCES: Preferences = {
  // ========== 应用配置 ==========
  app: {
    /** 权限模式: frontend-前端控制 | backend-后端控制 | mixed-混合 */
    accessMode: 'frontend',
    /** 登录页布局: panel-left | panel-center | panel-right */
    authPageLayout: 'panel-right',
    /** 检查更新间隔（分钟），0 表示禁用 */
    checkUpdatesInterval: 1,
    /** 浅色模式背景跟随主题色 */
    colorFollowPrimaryLight: false,
    /** 深色模式背景跟随主题色（默认开启，背景色带有主题色调） */
    colorFollowPrimaryDark: true,
    /** 灰色模式（哀悼模式） */
    colorGrayMode: false,
    /** 色弱模式（无障碍） */
    colorWeakMode: false,
    /** 紧凑模式 */
    compact: false,
    /** 内容区域宽度模式: wide-宽屏 | compact-紧凑 */
    contentCompact: 'wide',
    /** 内容紧凑宽度 (px) */
    contentCompactWidth: 1200,
    /** 内容内边距 (px) - 统一设置 */
    contentPadding: 16,
    /** 内容底部内边距 (px) */
    contentPaddingBottom: 16,
    /** 内容左侧内边距 (px) */
    contentPaddingLeft: 16,
    /** 内容右侧内边距 (px) */
    contentPaddingRight: 16,
    /** 内容顶部内边距 (px) */
    contentPaddingTop: 16,
    /** 默认头像 URL */
    defaultAvatar: '',
    /** 默认首页路径 */
    defaultHomePath: '/',
    /** 动态标题（根据路由变化） */
    dynamicTitle: true,
    /** 启用检查更新 */
    enableCheckUpdates: true,
    /** 启用偏好设置面板 */
    enablePreferences: true,
    /** 启用 RefreshToken 机制 */
    enableRefreshToken: false,
    /** 偏好设置面板导航栏吸顶 */
    enableStickyPreferencesNavigationBar: true,
    /** 是否移动端（自动检测） */
    isMobile: false,
    /** 布局模式 */
    layout: 'sidebar-nav',
    /** 语言 */
    locale: 'zh-CN',
    /** 登录过期处理: modal-弹窗 | page-跳转 */
    loginExpiredMode: 'page',
    /** 应用名称 */
    name: 'Admin Core',
    /** 偏好设置按钮位置: auto | fixed | header */
    preferencesButtonPosition: 'auto',
    /** 水印 */
    watermark: false,
    /** 水印内容 */
    watermarkContent: '',
    /** 水印角度 (度) */
    watermarkAngle: -22,
    /** 水印是否附加日期 */
    watermarkAppendDate: false,
    /** 水印字体大小 (px) */
    watermarkFontSize: 16,
    /** 全局 z-index 基准值 */
    zIndex: 200,
  },

  // ========== 面包屑配置 ==========
  breadcrumb: {
    /** 启用面包屑 */
    enable: true,
    /** 只有一个时隐藏 */
    hideOnlyOne: false,
    /** 显示首页 */
    showHome: false,
    /** 显示图标 */
    showIcon: true,
    /** 样式: normal | background */
    styleType: 'normal',
  },

  // ========== 版权配置 ==========
  copyright: {
    /** 公司名称 */
    companyName: '',
    /** 公司网站链接 */
    companySiteLink: '',
    /** 版权年份 */
    date: new Date().getFullYear().toString(),
    /** 启用版权信息 */
    enable: true,
    /** ICP 备案号 */
    icp: '',
    /** ICP 链接 */
    icpLink: '',
    /** 在设置面板中显示 */
    settingShow: true,
  },

  // ========== 页脚配置 ==========
  footer: {
    /** 启用页脚 */
    enable: false,
    /** 固定页脚 */
    fixed: false,
    /** 页脚高度 (px) */
    height: 32,
  },

  // ========== 顶栏配置 ==========
  header: {
    /** 启用顶栏 */
    enable: true,
    /** 顶栏高度 (px) */
    height: 50,
    /** 隐藏顶栏（CSS 隐藏，用于最大化内容区） */
    hidden: false,
    /** 菜单对齐方式: start | center | end */
    menuAlign: 'start',
    /** 菜单启动器模式（将菜单折叠为一个按钮，点击弹出菜单面板） */
    menuLauncher: false,
    /** 顶栏模式: fixed | static | auto | auto-scroll */
    mode: 'fixed',
  },

  // ========== 锁屏配置 ==========
  lockScreen: {
    /** 是否已锁定 */
    isLocked: false,
    /** 锁屏密码 */
    password: '',
    /** 锁屏背景图 URL */
    backgroundImage: '',
    /** 自动锁屏时间（分钟），0 表示禁用 */
    autoLockTime: 0,
  },

  // ========== Logo 配置 ==========
  logo: {
    /** 启用 Logo */
    enable: true,
    /** 图片适应方式 */
    fit: 'contain',
    /** Logo 图片 URL */
    source: '',
    /** 暗色模式 Logo URL（可选，空字符串表示使用默认 source） */
    sourceDark: '',
  },

  // ========== 导航配置 ==========
  navigation: {
    /** 手风琴模式（同级只展开一个） */
    accordion: true,
    /** 分割菜单（仅 mixed-nav 模式） */
    split: true,
    /** 导航风格: rounded | plain */
    styleType: 'rounded',
  },

  // ========== 功能区配置 ==========
  panel: {
    /** 启用功能区 */
    enable: false,
    /** 功能区位置: left | right */
    position: 'right',
    /** 折叠状态 */
    collapsed: false,
    /** 显示折叠按钮 */
    collapsedButton: true,
    /** 展开宽度 (px) */
    width: 260,
    /** 折叠宽度 (px) */
    collapsedWidth: 48,
  },

  // ========== 快捷键配置 ==========
  shortcutKeys: {
    /** 启用全局快捷键 */
    enable: true,
    /** 锁屏快捷键 */
    globalLockScreen: true,
    /** 登出快捷键 */
    globalLogout: true,
    /** 打开偏好设置快捷键 */
    globalPreferences: true,
    /** 全局搜索快捷键 */
    globalSearch: true,
  },

  // ========== 侧边栏配置 ==========
  sidebar: {
    /** 点击目录自动激活子菜单 */
    autoActivateChild: false,
    /** 折叠状态 */
    collapsed: false,
    /** 显示折叠按钮 */
    collapsedButton: true,
    /** 折叠时显示标题 */
    collapsedShowTitle: false,
    /** 折叠宽度 (px) */
    collapseWidth: 60,
    /** 启用侧边栏 */
    enable: true,
    /** 悬停时展开 */
    expandOnHover: true,
    /** 扩展区域折叠 */
    extraCollapse: false,
    /** 扩展区域折叠宽度 (px) */
    extraCollapsedWidth: 60,
    /** 显示固定按钮 */
    fixedButton: true,
    /** 隐藏侧边栏（CSS 隐藏，用于最大化内容区） */
    hidden: false,
    /** 混合模式宽度 (px) */
    mixedWidth: 80,
    /** 展开宽度 (px) */
    width: 224,
  },

  // ========== 标签栏配置 ==========
  tabbar: {
    /** 可拖拽排序 */
    draggable: true,
    /** 启用标签栏 */
    enable: true,
    /** 标签栏高度 (px) */
    height: 38,
    /** 页面缓存 (keep-alive) */
    keepAlive: true,
    /** 最大标签数量，0 表示不限制 */
    maxCount: 0,
    /** 中键点击关闭 */
    middleClickToClose: false,
    /** 持久化标签（刷新保留） */
    persist: true,
    /** 显示图标 */
    showIcon: true,
    /** 显示最大化按钮 */
    showMaximize: true,
    /** 显示更多按钮 */
    showMore: true,
    /** 标签样式: chrome | card | plain | brisk */
    styleType: 'chrome',
    /** 响应鼠标滚轮 */
    wheelable: true,
  },

  // ========== 主题配置 ==========
  theme: {
    /** 内置主题类型 */
    builtinType: 'default',
    /**
     * 主色（唯一需要配置的颜色）
     * @description 使用 OKLCH 格式，语义色自动派生
     */
    colorPrimary: DEFAULT_PRIMARY_COLOR,
    /** 字体缩放比例 (1.0 = 100% = 16px) */
    fontScale: 1.0,
    /** 主题模式: light | dark | auto */
    mode: 'auto',
    /** 圆角 (rem) */
    radius: '0.5',
    /** 半深色顶栏（仅亮色模式生效） */
    semiDarkHeader: false,
    /** 半深色侧边栏（仅亮色模式生效） */
    semiDarkSidebar: false,
  },

  // ========== 过渡动画配置 ==========
  transition: {
    /** 启用页面切换动画 */
    enable: true,
    /** 页面加载动画 */
    loading: true,
    /** 动画名称: fade | fade-slide | fade-up | fade-down */
    name: 'fade-slide',
    /** 显示加载进度条 */
    progress: true,
  },

  // ========== 小部件配置 ==========
  widget: {
    /** 全屏按钮 */
    fullscreen: true,
    /** 全局搜索 */
    globalSearch: true,
    /** 语言切换 */
    languageToggle: true,
    /** 锁屏按钮 */
    lockScreen: true,
    /** 通知按钮 */
    notification: true,
    /** 刷新按钮 */
    refresh: true,
    /** 侧边栏切换按钮 */
    sidebarToggle: true,
    /** 主题切换按钮 */
    themeToggle: true,
    /** 时区选择 */
    timezone: true,
  },
};

/**
 * 缓存的默认偏好设置 JSON 字符串
 * @description 预先序列化，避免每次调用都执行 JSON.stringify
 */
let cachedDefaultPreferencesJSON: string | null = null;

/**
 * 获取默认偏好设置的深拷贝
 * @description 使用缓存的 JSON 字符串，只需执行一次 stringify
 * @returns 默认偏好设置副本
 */
export function getDefaultPreferences(): Preferences {
  // 延迟初始化缓存（仅在首次调用时序列化）
  if (cachedDefaultPreferencesJSON === null) {
    cachedDefaultPreferencesJSON = JSON.stringify(DEFAULT_PREFERENCES);
  }
  return JSON.parse(cachedDefaultPreferencesJSON);
}

/**
 * 清除默认偏好设置缓存
 * @description 当默认值需要更新时调用（通常不需要）
 */
export function clearDefaultPreferencesCache(): void {
  cachedDefaultPreferencesJSON = null;
}
