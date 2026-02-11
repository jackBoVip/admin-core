/**
 * UI 功能状态公共纯函数
 * @description 提供 React/Vue 共用的 preferences/user/notification/refresh 派生逻辑
 */

import type {
  BasicLayoutProps,
  LayoutEvents,
  NotificationItem,
  TabItem,
  UserInfo,
} from '../types';

export function resolvePreferencesPanelSnapshot(props: BasicLayoutProps) {
  return {
    enabled: props.enablePreferences !== false,
    position: props.preferencesButtonPosition || 'auto',
    stickyNav: props.enableStickyPreferencesNav !== false,
  };
}

export function resolveLocaleValue(props: BasicLayoutProps): string {
  return props.locale || 'zh-CN';
}

export function resolveUserInfoSnapshot(props: BasicLayoutProps): {
  userInfo: UserInfo | undefined;
  avatar: string;
  displayName: string;
  roles: string[];
} {
  const userInfo = props.userInfo;
  return {
    userInfo,
    avatar: userInfo?.avatar || props.defaultAvatar || '',
    displayName: userInfo?.displayName || userInfo?.username || '',
    roles: userInfo?.roles || [],
  };
}

export function resolveNotificationsSnapshot(props: BasicLayoutProps) {
  const notifications = props.notifications || [];
  const unreadCount = props.unreadCount || 0;
  return {
    notifications,
    unreadCount,
    hasUnread: unreadCount > 0,
  };
}

export function resolveRefreshTarget(options: {
  tabs?: TabItem[];
  activeTabKey?: string;
  currentPath?: string;
}): {
  activeKey: string;
  activeTab?: TabItem;
} {
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

export interface LayoutPreferencesPanelStateControllerOptions {
  getEnabled: () => boolean;
  getIsOpen: () => boolean;
  setIsOpen: (value: boolean) => void;
}

export interface LayoutPreferencesPanelStateController {
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export interface LayoutUIEventsControllerOptions {
  getEvents: () => Pick<
    LayoutEvents,
    'onLocaleChange' | 'onUserMenuSelect' | 'onLogout' | 'onNotificationClick'
  >;
}

export interface LayoutUIEventsController {
  changeLocale: (locale: string) => void;
  handleUserMenuSelect: (key: string) => void;
  handleLogout: () => void;
  handleNotificationClick: (item: NotificationItem) => void;
}

/**
 * 创建偏好面板开关控制器
 */
export function createLayoutPreferencesPanelStateController(
  options: LayoutPreferencesPanelStateControllerOptions
): LayoutPreferencesPanelStateController {
  const open = () => {
    if (!options.getEnabled()) return;
    options.setIsOpen(true);
  };

  const close = () => {
    options.setIsOpen(false);
  };

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
 * 创建 UI 事件控制器（locale / user / notification）
 */
export function createLayoutUIEventsController(
  options: LayoutUIEventsControllerOptions
): LayoutUIEventsController {
  const changeLocale = (locale: string) => {
    options.getEvents().onLocaleChange?.(locale);
  };

  const handleUserMenuSelect = (key: string) => {
    options.getEvents().onUserMenuSelect?.(key);
  };

  const handleLogout = () => {
    options.getEvents().onLogout?.();
  };

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
