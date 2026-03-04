/**
 * 布局界面状态公共纯函数。
 * @description 提供 React/Vue 共用的偏好面板、用户信息、通知与刷新目标派生逻辑。
 */

import type {
  BasicLayoutProps,
  LayoutEvents,
  NotificationItem,
  TabItem,
  UserInfo,
} from '../types';

/**
 * 解析偏好面板状态快照。
 * @param props 布局配置。
 * @returns 偏好面板状态快照。
 */
export function resolvePreferencesPanelSnapshot(props: BasicLayoutProps) {
  return {
    enabled: props.enablePreferences !== false,
    position: props.preferencesButtonPosition || 'auto',
    stickyNav: props.enableStickyPreferencesNav !== false,
  };
}

/**
 * 解析当前语言值。
 * @param props 布局配置。
 * @returns 当前语言。
 */
export function resolveLocaleValue(props: BasicLayoutProps): string {
  return props.locale || 'zh-CN';
}

/** 用户信息展示快照。 */
export interface UserInfoSnapshot {
  /** 原始用户信息。 */
  userInfo: UserInfo | undefined;
  /** 最终头像地址。 */
  avatar: string;
  /** 最终展示名。 */
  displayName: string;
  /** 用户角色列表。 */
  roles: string[];
}

/**
 * 解析用户信息快照。
 * @param props 布局配置。
 * @returns 用户信息快照。
 */
export function resolveUserInfoSnapshot(props: BasicLayoutProps): UserInfoSnapshot {
  const userInfo = props.userInfo;
  return {
    userInfo,
    avatar: userInfo?.avatar || props.defaultAvatar || '',
    displayName: userInfo?.displayName || userInfo?.username || '',
    roles: userInfo?.roles || [],
  };
}

/**
 * 解析通知状态快照。
 * @param props 布局配置。
 * @returns 通知状态快照。
 */
export function resolveNotificationsSnapshot(props: BasicLayoutProps) {
  const notifications = props.notifications || [];
  const unreadCount = props.unreadCount || 0;
  return {
    notifications,
    unreadCount,
    hasUnread: unreadCount > 0,
  };
}

/** 刷新目标解析参数。 */
export interface ResolveRefreshTargetOptions {
  /** 标签列表。 */
  tabs?: TabItem[];
  /** 当前激活标签 key。 */
  activeTabKey?: string;
  /** 当前路径。 */
  currentPath?: string;
}

/** 刷新目标快照。 */
export interface RefreshTargetSnapshot {
  /** 最终激活 key。 */
  activeKey: string;
  /** 命中的激活标签。 */
  activeTab?: TabItem;
}

/**
 * 解析刷新目标（激活标签或当前路径）。
 * @param options 解析参数。
 * @returns 刷新目标快照。
 */
export function resolveRefreshTarget(
  options: ResolveRefreshTargetOptions
): RefreshTargetSnapshot {
  const tabs = options.tabs || [];
  const activeKey = options.activeTabKey || options.currentPath || '';
  if (!activeKey) {
    return {
      activeKey: '',
      activeTab: undefined,
    };
  }
  return {
    activeKey,
    activeTab: tabs.find((tab) => tab.key === activeKey),
  };
}

/** 偏好面板状态控制器创建参数。 */
export interface LayoutPreferencesPanelStateControllerOptions {
  /** 偏好面板是否可用。 */
  getEnabled: () => boolean;
  /** 获取当前打开状态。 */
  getIsOpen: () => boolean;
  /** 设置打开状态。 */
  setIsOpen: (value: boolean) => void;
}

/** 偏好面板状态控制器。 */
export interface LayoutPreferencesPanelStateController {
  /** 打开面板。 */
  open: () => void;
  /** 关闭面板。 */
  close: () => void;
  /** 切换面板开关。 */
  toggle: () => void;
}

/** 界面事件控制器创建参数。 */
export interface LayoutUIEventsControllerOptions {
  /** 获取事件回调集合。 */
  getEvents: () => Pick<
    LayoutEvents,
    'onLocaleChange' | 'onUserMenuSelect' | 'onLogout' | 'onNotificationClick'
  >;
}

/** 界面事件控制器。 */
export interface LayoutUIEventsController {
  /**
   * 触发语言切换事件。
   * @param locale 目标语言。
   */
  changeLocale: (locale: string) => void;
  /**
   * 触发用户菜单选择事件。
   * @param key 菜单项 key。
   */
  handleUserMenuSelect: (key: string) => void;
  /** 触发退出登录事件。 */
  handleLogout: () => void;
  /**
   * 触发通知点击事件。
   * @param item 通知项。
   */
  handleNotificationClick: (item: NotificationItem) => void;
}

/**
 * 创建偏好面板开关控制器。
 * @param options 控制器依赖项。
 * @returns 偏好面板状态控制器。
 */
export function createLayoutPreferencesPanelStateController(
  options: LayoutPreferencesPanelStateControllerOptions
): LayoutPreferencesPanelStateController {
  /**
   * 打开偏好设置面板。
   */
  const open = () => {
    if (!options.getEnabled()) return;
    options.setIsOpen(true);
  };

  /**
   * 关闭偏好设置面板。
   */
  const close = () => {
    options.setIsOpen(false);
  };

  /**
   * 切换偏好设置面板开关状态。
   */
  const toggle = () => {
    if (!options.getEnabled()) return;
    options.setIsOpen(!options.getIsOpen());
  };

  return {
    open,
    close,
    toggle,
  };
}

/**
 * 创建界面事件控制器（语言/用户/通知）。
 * @param options 控制器依赖项。
 * @returns 界面事件控制器。
 */
export function createLayoutUIEventsController(
  options: LayoutUIEventsControllerOptions
): LayoutUIEventsController {
  /**
   * 派发语言切换事件。
   * @param locale 目标语言编码。
   */
  const changeLocale = (locale: string) => {
    options.getEvents().onLocaleChange?.(locale);
  };

  /**
   * 派发用户菜单选择事件。
   * @param key 菜单项键。
   */
  const handleUserMenuSelect = (key: string) => {
    options.getEvents().onUserMenuSelect?.(key);
  };

  /**
   * 派发退出登录事件。
   */
  const handleLogout = () => {
    options.getEvents().onLogout?.();
  };

  /**
   * 派发通知点击事件。
   * @param item 被点击的通知项。
   */
  const handleNotificationClick = (item: NotificationItem) => {
    options.getEvents().onNotificationClick?.(item);
  };

  return {
    changeLocale,
    handleUserMenuSelect,
    handleLogout,
    handleNotificationClick,
  };
}
