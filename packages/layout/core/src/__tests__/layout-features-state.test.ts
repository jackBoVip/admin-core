import { describe, expect, it, vi } from 'vitest';
import {
  createLayoutDynamicTitleController,
  getCachedMenuPathIndex,
  handleShortcutKeydown,
  resolveCheckUpdatesEnabled,
  resolveDynamicTitleSnapshot,
  resolveLockScreenSnapshot,
  resolvePageTransitionSnapshot,
  resolveThemeSnapshot,
  resolveThemeToggleTargetMode,
  resolveWatermarkSnapshot,
} from '../utils';

describe('layout-features-state helpers', () => {
  it('should resolve theme snapshot', () => {
    const snapshot = resolveThemeSnapshot(
      {
        mode: 'auto',
        colorPrimary: 'red',
        colorGrayMode: true,
      },
      true
    );

    expect(snapshot.mode).toBe('auto');
    expect(snapshot.actualMode).toBe('dark');
    expect(snapshot.isGrayMode).toBe(true);
    expect(snapshot.cssVariables['--theme-mode']).toBe('dark');
    expect(resolveThemeToggleTargetMode('dark')).toBe('light');
  });

  it('should resolve watermark and lock-screen snapshot', () => {
    const watermark = resolveWatermarkSnapshot({
      enable: true,
      content: 'Admin',
      fontSize: 20,
    });
    expect(watermark.enabled).toBe(true);
    expect(watermark.canvasConfig.fontSize).toBe(20);

    const lockScreen = resolveLockScreenSnapshot({
      isLocked: true,
      showClock: false,
    });
    expect(lockScreen.isLocked).toBe(true);
    expect(lockScreen.showClock).toBe(false);
    expect(lockScreen.showDate).toBe(true);
  });

  it('should resolve check updates and transition snapshot', () => {
    expect(resolveCheckUpdatesEnabled({ enable: true })).toBe(true);

    const transition = resolvePageTransitionSnapshot({
      enable: true,
      name: 'slide-left',
      loading: false,
    });
    expect(transition.enabled).toBe(true);
    expect(transition.transitionName).toBe('slide-left');
    expect(transition.showLoading).toBe(false);
  });

  it('should resolve dynamic title snapshot', () => {
    const menus = [{ key: 'home', name: '首页', path: '/home' }];
    const menuIndex = getCachedMenuPathIndex(menus);
    const result = resolveDynamicTitleSnapshot({
      enabled: true,
      appName: 'Admin',
      menuIndex,
      currentPath: '/home?tab=1',
    });
    expect(result.pageTitle).toBe('首页');
    expect(result.title).toBe('首页 - Admin');
  });

  it('should ignore shortcut when event is already prevented', () => {
    const preventDefault = vi.fn();
    const result = handleShortcutKeydown(
      {
        defaultPrevented: true,
        preventDefault,
      } as unknown as KeyboardEvent,
      { enable: true },
      {}
    );

    expect(result.handled).toBe(false);
    expect(result.action).toBeNull();
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('should create dynamic title controller', () => {
    let enabled = true;
    let appName = 'Admin';
    const titles: string[] = [];

    const controller = createLayoutDynamicTitleController({
      getEnabled: () => enabled,
      getAppName: () => appName,
      setDocumentTitle: (title) => {
        titles.push(title);
      },
    });

    controller.updateTitle('首页');
    controller.applyTitle('用户管理 - Admin');
    expect(titles).toEqual(['首页 - Admin', '用户管理 - Admin']);

    enabled = false;
    appName = 'New App';
    controller.updateTitle('设置');
    controller.applyTitle('设置 - New App');
    expect(titles).toEqual(['首页 - Admin', '用户管理 - Admin']);
  });
});
