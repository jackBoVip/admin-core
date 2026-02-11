import {
  createLayoutPreferencesPanelStateController,
  createLayoutRefreshController,
  createLayoutUIEventsController,
  resolveLocaleValue,
  resolveNotificationsSnapshot,
  resolvePreferencesPanelSnapshot,
  resolveUserInfoSnapshot,
} from '@admin-core/layout';
import { computed, onUnmounted, ref } from 'vue';
import { useLayoutContext } from '../use-layout-context';
import { useRouter } from './router';

export function usePreferencesPanel() {
  const context = useLayoutContext();

  const snapshot = computed(() => resolvePreferencesPanelSnapshot(context.props));

  const isOpen = ref(false);

  const controller = createLayoutPreferencesPanelStateController({
    getEnabled: () => snapshot.value.enabled,
    getIsOpen: () => isOpen.value,
    setIsOpen: (value) => {
      isOpen.value = value;
    },
  });

  const open = () => controller.open();
  const close = () => controller.close();
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

export function useLocale() {
  const context = useLayoutContext();

  const locale = computed(() => resolveLocaleValue(context.props));
  const eventsController = createLayoutUIEventsController({
    getEvents: () => context.events,
  });

  const changeLocale = (newLocale: string) => {
    eventsController.changeLocale(newLocale);
  };

  return {
    locale,
    changeLocale,
  };
}

export function useUserInfo() {
  const context = useLayoutContext();

  const snapshot = computed(() => resolveUserInfoSnapshot(context.props));
  const eventsController = createLayoutUIEventsController({
    getEvents: () => context.events,
  });

  const handleMenuSelect = (key: string) => {
    eventsController.handleUserMenuSelect(key);
  };

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

export function useNotifications() {
  const context = useLayoutContext();

  const snapshot = computed(() => resolveNotificationsSnapshot(context.props));
  const eventsController = createLayoutUIEventsController({
    getEvents: () => context.events,
  });

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

export function useRefresh() {
  const context = useLayoutContext();
  const { currentPath } = useRouter();

  const isRefreshing = ref(false);
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

  const refresh = () => runtime.refresh();

  onUnmounted(() => {
    runtime.destroy();
  });

  return {
    isRefreshing,
    refresh,
  };
}
