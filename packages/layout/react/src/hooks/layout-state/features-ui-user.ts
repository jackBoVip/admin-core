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

export function usePreferencesPanel() {
  const context = useLayoutContext();

  const snapshot = useMemo(() => resolvePreferencesPanelSnapshot(context.props), [context.props]);

  const [isOpen, setIsOpen] = useState(false);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

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

  const open = useCallback(() => controller.open(), [controller]);
  const close = useCallback(() => controller.close(), [controller]);
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

export function useLocale() {
  const context = useLayoutContext();

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

export function useUserInfo() {
  const context = useLayoutContext();

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

export function useNotifications() {
  const context = useLayoutContext();

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

export function useRefresh() {
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

  const refresh = useCallback(() => runtime.refresh(), [runtime]);

  return {
    isRefreshing,
    refresh,
  };
}
