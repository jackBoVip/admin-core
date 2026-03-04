/**
 * UI 与用户域状态 Hook 集（React）。
 * @description 聚合偏好面板、语言、用户信息、通知与刷新等头部交互能力。
 */
import {
  createLayoutPreferencesPanelStateController,
  createLayoutRefreshController,
  createLayoutUIEventsController,
  resolveLocaleValue,
  resolveNotificationsSnapshot,
  resolvePreferencesPanelSnapshot,
  resolveUserInfoSnapshot,
} from '@admin-core/layout';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLayoutContext, useLayoutState } from '../use-layout-context';
import { useRouter } from './router';

/**
 * 偏好面板快照类型。
 */
type PreferencesPanelSnapshot = ReturnType<typeof resolvePreferencesPanelSnapshot>;
/**
 * 用户信息快照类型。
 */
type UserInfoSnapshot = ReturnType<typeof resolveUserInfoSnapshot>;
/**
 * 通知快照类型。
 */
type NotificationsSnapshot = ReturnType<typeof resolveNotificationsSnapshot>;

/**
 * `usePreferencesPanel` 返回值。
 */
export interface UsePreferencesPanelReturn {
  /** 偏好面板功能是否启用。 */
  enabled: PreferencesPanelSnapshot['enabled'];
  /** 偏好面板展示位置。 */
  position: PreferencesPanelSnapshot['position'];
  /** 是否吸附在导航区。 */
  stickyNav: PreferencesPanelSnapshot['stickyNav'];
  /** 面板开关状态。 */
  isOpen: boolean;
  /** 打开偏好面板。 */
  open: () => void;
  /** 关闭偏好面板。 */
  close: () => void;
  /** 切换偏好面板开关状态。 */
  toggle: () => void;
}

/**
 * `useLocale` 返回值。
 */
export interface UseLocaleReturn {
  /** 当前语言标识。 */
  locale: ReturnType<typeof resolveLocaleValue>;
  /** 切换应用语言。 */
  changeLocale: (newLocale: string) => void;
}

/**
 * `useUserInfo` 返回值。
 */
export interface UseUserInfoReturn {
  /** 用户原始信息。 */
  userInfo: UserInfoSnapshot['userInfo'];
  /** 用户头像地址。 */
  avatar: UserInfoSnapshot['avatar'];
  /** 用户展示名。 */
  displayName: UserInfoSnapshot['displayName'];
  /** 用户角色列表。 */
  roles: UserInfoSnapshot['roles'];
  /** 处理用户菜单动作。 */
  handleMenuSelect: (key: string) => void;
  /** 处理用户登出动作。 */
  handleLogout: () => void;
}

/**
 * `useNotifications` 返回值。
 */
export interface UseNotificationsReturn {
  /** 通知列表。 */
  notifications: NotificationsSnapshot['notifications'];
  /** 未读通知数量。 */
  unreadCount: NotificationsSnapshot['unreadCount'];
  /** 是否存在未读通知。 */
  hasUnread: NotificationsSnapshot['hasUnread'];
  /** 处理通知点击。 */
  handleClick: (item: NotificationsSnapshot['notifications'][number]) => void;
}

/**
 * `useRefresh` 返回值。
 */
export interface UseRefreshReturn {
  /** 当前是否处于刷新中。 */
  isRefreshing: boolean;
  /** 触发刷新流程。 */
  refresh: () => void;
}

/**
 * 偏好设置抽屉状态与操作。
 * @description 聚合偏好抽屉启用状态、展示位置和开关行为。
 * @returns 偏好抽屉状态快照与操作方法。
 */
export function usePreferencesPanel(): UsePreferencesPanelReturn {
  const context = useLayoutContext();

  /**
   * 偏好面板展示快照。
   */
  const snapshot = useMemo(() => resolvePreferencesPanelSnapshot(context.props), [context.props]);

  const [isOpen, setIsOpen] = useState(false);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  /**
   * 偏好面板状态控制器。
   */
  const controller = useMemo(
    () =>
      createLayoutPreferencesPanelStateController({
        getEnabled: () => snapshot.enabled,
        getIsOpen: () => isOpenRef.current,
        setIsOpen: (value) => {
          isOpenRef.current = value;
          setIsOpen((prev) => (prev === value ? prev : value));
        },
      }),
    [snapshot.enabled]
  );

  /**
   * 打开偏好设置面板。
   */
  const open = useCallback(() => controller.open(), [controller]);
  /**
   * 关闭偏好设置面板。
   */
  const close = useCallback(() => controller.close(), [controller]);
  /**
   * 切换偏好设置面板开关状态。
   */
  const toggle = useCallback(() => controller.toggle(), [controller]);

  return {
    enabled: snapshot.enabled,
    position: snapshot.position,
    stickyNav: snapshot.stickyNav,
    isOpen,
    open,
    close,
    toggle,
  };
}

/**
 * 语言状态与切换操作。
 * @description 读取当前语言并提供统一语言切换入口。
 * @returns 当前语言与切换方法。
 */
export function useLocale(): UseLocaleReturn {
  const context = useLayoutContext();

  /**
   * 当前语言值。
   */
  const locale = resolveLocaleValue(context.props);
  const eventsRef = useRef(context.events);
  eventsRef.current = context.events;

  const eventsController = useMemo(
    () =>
      createLayoutUIEventsController({
        getEvents: () => eventsRef.current,
      }),
    []
  );

  /**
   * 切换应用语言。
   *
   * @param newLocale 目标语言标识。
   */
  const changeLocale = useCallback(
    (newLocale: string) => {
      eventsController.changeLocale(newLocale);
    },
    [eventsController]
  );

  return {
    locale,
    changeLocale,
  };
}

/**
 * 用户信息与用户菜单操作。
 * @description 汇总头像、角色、菜单点击与退出登录行为。
 * @returns 用户展示信息与交互方法。
 */
export function useUserInfo(): UseUserInfoReturn {
  const context = useLayoutContext();

  /**
   * 用户信息展示快照。
   */
  const snapshot = useMemo(() => resolveUserInfoSnapshot(context.props), [context.props]);
  const eventsRef = useRef(context.events);
  eventsRef.current = context.events;

  const eventsController = useMemo(
    () =>
      createLayoutUIEventsController({
        getEvents: () => eventsRef.current,
      }),
    []
  );

  /**
   * 处理用户菜单项选择事件。
   *
   * @param key 菜单动作键。
   */
  const handleMenuSelect = useCallback(
    (key: string) => {
      eventsController.handleUserMenuSelect(key);
    },
    [eventsController]
  );

  const handleLogout = useCallback(() => {
    eventsController.handleLogout();
  }, [eventsController]);

  return {
    userInfo: snapshot.userInfo,
    avatar: snapshot.avatar,
    displayName: snapshot.displayName,
    roles: snapshot.roles,
    handleMenuSelect,
    handleLogout,
  };
}

/**
 * 通知列表与点击处理。
 * @description 提供通知展示快照和点击回调派发能力。
 * @returns 通知数据、未读统计与点击处理方法。
 */
export function useNotifications(): UseNotificationsReturn {
  const context = useLayoutContext();

  /**
   * 通知展示快照。
   */
  const snapshot = useMemo(() => resolveNotificationsSnapshot(context.props), [context.props]);
  const eventsRef = useRef(context.events);
  eventsRef.current = context.events;

  const eventsController = useMemo(
    () =>
      createLayoutUIEventsController({
        getEvents: () => eventsRef.current,
      }),
    []
  );

  /**
   * 处理通知点击事件。
   *
   * @param item 被点击通知项。
   */
  const handleClick = useCallback((item: (typeof snapshot.notifications)[number]) => {
    eventsController.handleNotificationClick(item);
  }, [eventsController]);

  return {
    notifications: snapshot.notifications,
    unreadCount: snapshot.unreadCount,
    hasUnread: snapshot.hasUnread,
    handleClick,
  };
}

/**
 * 页面刷新状态与触发操作。
 * @description 统一处理标签刷新与全局刷新回调。
 * @returns 刷新状态与刷新触发函数。
 */
export function useRefresh(): UseRefreshReturn {
  const context = useLayoutContext();
  const [, setState] = useLayoutState();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isRefreshingRef = useRef(isRefreshing);
  isRefreshingRef.current = isRefreshing;

  const eventsRef = useRef(context.events);
  eventsRef.current = context.events;
  const tabsRef = useRef(context.props.tabs || []);
  tabsRef.current = context.props.tabs || [];
  const activeTabKeyRef = useRef(context.props.activeTabKey);
  activeTabKeyRef.current = context.props.activeTabKey;

  const { currentPath } = useRouter();
  const currentPathRef = useRef(currentPath);
  currentPathRef.current = currentPath;

  /**
   * 刷新运行时控制器，统一处理标签刷新与全局刷新事件。
   */
  const runtime = useMemo(
    () =>
      createLayoutRefreshController({
        getTabs: () => tabsRef.current,
        getActiveTabKey: () => activeTabKeyRef.current,
        getCurrentPath: () => currentPathRef.current,
        getIsRefreshing: () => isRefreshingRef.current,
        setIsRefreshing: (value) => {
          isRefreshingRef.current = value;
          setIsRefreshing(value);
        },
        triggerRefreshKey: () => {
          setState((prev) => ({ ...prev, refreshKey: prev.refreshKey + 1 }));
        },
        onTabRefresh: (tab, key) => {
          eventsRef.current.onTabRefresh?.(tab, key);
        },
        onRefresh: () => {
          eventsRef.current.onRefresh?.();
        },
        delayMs: 500,
      }),
    [setState]
  );

  useEffect(() => {
    return () => runtime.destroy();
  }, [runtime]);

  /**
   * 触发刷新流程。
   */
  const refresh = useCallback(() => runtime.refresh(), [runtime]);

  return {
    isRefreshing,
    refresh,
  };
}
