import { describe, expect, it, vi } from 'vitest';
import {
  createLayoutPreferencesPanelStateController,
  createLayoutUIEventsController,
  resolveLocaleValue,
  resolveNotificationsSnapshot,
  resolvePreferencesPanelSnapshot,
  resolveRefreshTarget,
  resolveUserInfoSnapshot,
} from '../utils';

describe('layout-ui-state helpers', () => {
  it('should resolve preferences panel snapshot', () => {
    expect(
      resolvePreferencesPanelSnapshot({
        enablePreferences: true,
        preferencesButtonPosition: 'bottom-right',
        enableStickyPreferencesNav: false,
      })
    ).toEqual({
      enabled: true,
      position: 'bottom-right',
      stickyNav: false,
    });
  });

  it('should resolve locale and user snapshot', () => {
    expect(resolveLocaleValue({})).toBe('zh-CN');
    const user = resolveUserInfoSnapshot({
      defaultAvatar: '/default.png',
      userInfo: {
        id: '1',
        username: 'admin',
      },
    });
    expect(user.avatar).toBe('/default.png');
    expect(user.displayName).toBe('admin');
  });

  it('should resolve notifications and refresh target', () => {
    const notifications = resolveNotificationsSnapshot({
      notifications: [{ id: '1', title: 'title' }],
      unreadCount: 3,
    });
    expect(notifications.hasUnread).toBe(true);

    const refresh = resolveRefreshTarget({
      activeTabKey: '/workbench',
      tabs: [{ key: '/workbench', name: 'workbench', path: '/workbench' }],
    });
    expect(refresh.activeKey).toBe('/workbench');
    expect(refresh.activeTab?.name).toBe('workbench');
  });

  it('should control preferences panel open state by enabled flag', () => {
    const state = {
      enabled: true,
      isOpen: false,
    };

    const controller = createLayoutPreferencesPanelStateController({
      getEnabled: () => state.enabled,
      getIsOpen: () => state.isOpen,
      setIsOpen: (value) => {
        state.isOpen = value;
      },
    });

    controller.open();
    expect(state.isOpen).toBe(true);

    controller.toggle();
    expect(state.isOpen).toBe(false);

    state.enabled = false;
    controller.open();
    expect(state.isOpen).toBe(false);

    controller.close();
    expect(state.isOpen).toBe(false);
  });

  it('should dispatch ui events from controller', () => {
    const onLocaleChange = vi.fn();
    const onUserMenuSelect = vi.fn();
    const onLogout = vi.fn();
    const onNotificationClick = vi.fn();

    const controller = createLayoutUIEventsController({
      getEvents: () => ({
        onLocaleChange,
        onUserMenuSelect,
        onLogout,
        onNotificationClick,
      }),
    });

    controller.changeLocale('en-US');
    controller.handleUserMenuSelect('profile');
    controller.handleLogout();
    controller.handleNotificationClick({ id: 'n1', title: '提醒' });

    expect(onLocaleChange).toHaveBeenCalledWith('en-US');
    expect(onUserMenuSelect).toHaveBeenCalledWith('profile');
    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(onNotificationClick).toHaveBeenCalledWith({ id: 'n1', title: '提醒' });
  });
});
