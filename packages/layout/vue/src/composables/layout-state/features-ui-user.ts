/**
 * UI 与用户域状态 Composable 集（Vue）。
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
import { computed, onUnmounted, ref, type ComputedRef, type Ref } from 'vue';
import { useLayoutContext } from '../use-layout-context';
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
  enabled: ComputedRef<PreferencesPanelSnapshot['enabled']>;
  /** 偏好面板展示位置。 */
  position: ComputedRef<PreferencesPanelSnapshot['position']>;
  /** 是否吸附在导航区。 */
  stickyNav: ComputedRef<PreferencesPanelSnapshot['stickyNav']>;
  /** 面板开关状态。 */
  isOpen: Ref<boolean>;
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
  locale: ComputedRef<ReturnType<typeof resolveLocaleValue>>;
  /** 切换应用语言。 */
  changeLocale: (newLocale: string) => void;
}

/**
 * `useUserInfo` 返回值。
 */
export interface UseUserInfoReturn {
  /** 用户原始信息。 */
  userInfo: ComputedRef<UserInfoSnapshot['userInfo']>;
  /** 用户头像地址。 */
  avatar: ComputedRef<UserInfoSnapshot['avatar']>;
  /** 用户展示名。 */
  displayName: ComputedRef<UserInfoSnapshot['displayName']>;
  /** 用户角色列表。 */
  roles: ComputedRef<UserInfoSnapshot['roles']>;
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
  notifications: ComputedRef<NotificationsSnapshot['notifications']>;
  /** 未读通知数量。 */
  unreadCount: ComputedRef<NotificationsSnapshot['unreadCount']>;
  /** 是否存在未读通知。 */
  hasUnread: ComputedRef<NotificationsSnapshot['hasUnread']>;
  /** 处理通知点击。 */
  handleClick: (item: NotificationsSnapshot['notifications'][number]) => void;
}

/**
 * `useRefresh` 返回值。
 */
export interface UseRefreshReturn {
  /** 当前是否处于刷新中。 */
  isRefreshing: Ref<boolean>;
  /** 触发刷新流程。 */
  refresh: () => void;
}

/**
 * 偏好设置抽屉状态与操作。
 * @description 聚合偏好抽屉启用状态、展示位置和开关行为。
 * @returns 偏好抽屉能力开关、展示配置与开关控制方法。
 */
export function usePreferencesPanel(): UsePreferencesPanelReturn {
  /**
   * 布局上下文
   * @description 提供偏好面板配置来源。
   */
  const context = useLayoutContext();

  /**
   * 偏好抽屉展示快照。
   */
  const snapshot = computed(() => resolvePreferencesPanelSnapshot(context.props));

  /**
   * 偏好抽屉开关状态。
   */
  const isOpen = ref(false);

  /**
   * 偏好抽屉状态控制器。
   */
  const controller = createLayoutPreferencesPanelStateController({
    getEnabled: () => snapshot.value.enabled,
    getIsOpen: () => isOpen.value,
    setIsOpen: (value) => {
      isOpen.value = value;
    },
  });

  /** 打开偏好设置抽屉。 */
  const open = () => controller.open();
  /** 关闭偏好设置抽屉。 */
  const close = () => controller.close();
  /** 切换偏好设置抽屉开关状态。 */
  const toggle = () => controller.toggle();

  return {
    enabled: computed(() => snapshot.value.enabled),
    position: computed(() => snapshot.value.position),
    stickyNav: computed(() => snapshot.value.stickyNav),
    isOpen,
    open,
    close,
    toggle,
  };
}

/**
 * 语言状态与切换操作。
 * @description 读取当前语言并提供统一语言切换入口。
 * @returns 当前语言标识与语言切换方法。
 */
export function useLocale(): UseLocaleReturn {
  /**
   * 布局上下文
   * @description 提供当前语言配置与事件分发能力。
   */
  const context = useLayoutContext();

  /**
   * 当前语言标识。
   */
  const locale = computed(() => resolveLocaleValue(context.props));
  /**
   * UI 事件控制器。
   */
  const eventsController = createLayoutUIEventsController({
    getEvents: () => context.events,
  });

  /**
   * 切换应用语言。
   *
   * @param newLocale 目标语言标识。
   */
  const changeLocale = (newLocale: string) => {
    eventsController.changeLocale(newLocale);
  };

  return {
    locale,
    changeLocale,
  };
}

/**
 * 用户信息与用户菜单操作。
 * @description 汇总头像、角色、菜单点击与退出登录行为。
 * @returns 用户展示信息与菜单动作处理方法。
 */
export function useUserInfo(): UseUserInfoReturn {
  /**
   * 布局上下文
   * @description 提供用户信息配置与用户菜单事件回调。
   */
  const context = useLayoutContext();

  /**
   * 用户信息展示快照。
   */
  const snapshot = computed(() => resolveUserInfoSnapshot(context.props));
  /**
   * UI 事件控制器。
   */
  const eventsController = createLayoutUIEventsController({
    getEvents: () => context.events,
  });

  /**
   * 处理用户菜单项选择。
   *
   * @param key 菜单动作键。
   */
  const handleMenuSelect = (key: string) => {
    eventsController.handleUserMenuSelect(key);
  };

  /**
   * 处理用户登出动作。
   */
  const handleLogout = () => {
    eventsController.handleLogout();
  };

  return {
    userInfo: computed(() => snapshot.value.userInfo),
    avatar: computed(() => snapshot.value.avatar),
    displayName: computed(() => snapshot.value.displayName),
    roles: computed(() => snapshot.value.roles),
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
  /**
   * 布局上下文
   * @description 提供通知配置与通知点击事件回调。
   */
  const context = useLayoutContext();

  /**
   * 通知展示快照。
   */
  const snapshot = computed(() => resolveNotificationsSnapshot(context.props));
  /**
   * UI 事件控制器。
   */
  const eventsController = createLayoutUIEventsController({
    getEvents: () => context.events,
  });

  /**
   * 处理通知项点击。
   *
   * @param item 被点击通知项。
   */
  const handleClick = (item: (typeof snapshot.value.notifications)[number]) => {
    eventsController.handleNotificationClick(item);
  };

  return {
    notifications: computed(() => snapshot.value.notifications),
    unreadCount: computed(() => snapshot.value.unreadCount),
    hasUnread: computed(() => snapshot.value.hasUnread),
    handleClick,
  };
}

/**
 * 页面刷新状态与触发操作。
 * @description 统一处理标签刷新与全局刷新回调。
 * @returns 刷新状态及触发刷新方法。
 */
export function useRefresh(): UseRefreshReturn {
  /**
   * 布局上下文
   * @description 提供刷新相关配置、状态容器与刷新事件回调。
   */
  const context = useLayoutContext();
  /**
   * 路由状态
   * @description 提供当前路径用于刷新目标判定。
   */
  const { currentPath } = useRouter();

  /**
   * 刷新状态。
   */
  const isRefreshing = ref(false);
  /**
   * 刷新运行时控制器。
   */
  const runtime = createLayoutRefreshController({
    getTabs: () => context.props.tabs || [],
    getActiveTabKey: () => context.props.activeTabKey,
    getCurrentPath: () => currentPath.value,
    getIsRefreshing: () => isRefreshing.value,
    setIsRefreshing: (value) => {
      isRefreshing.value = value;
    },
    triggerRefreshKey: () => {
      context.state.refreshKey += 1;
    },
    onTabRefresh: (tab, key) => {
      context.events.onTabRefresh?.(tab, key);
    },
    onRefresh: () => {
      context.events.onRefresh?.();
    },
    delayMs: 500,
  });

  /**
   * 触发页面刷新流程。
   */
  const refresh = () => runtime.refresh();

  /**
   * 组件卸载时销毁刷新运行时，释放挂起任务。
   */
  onUnmounted(() => {
    runtime.destroy();
  });

  return {
    isRefreshing,
    refresh,
  };
}
