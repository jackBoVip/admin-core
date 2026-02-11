import { describe, expect, it, vi } from 'vitest';
import {
  buildLayoutPreferencesSnapshot,
  dispatchShortcutAction,
  resolveLocationPath,
  resolvePreferredCurrentPath,
  resolvePageTransitionName,
  resolveWindowPath,
} from '../utils';

describe('layout-state helpers', () => {
  it('should normalize page transition name', () => {
    expect(resolvePageTransitionName('slide-left')).toBe('slide-left');
    expect(resolvePageTransitionName('unknown')).toBe('fade-slide');
    expect(resolvePageTransitionName(undefined, 'fade')).toBe('fade');
  });

  it('should resolve location path from hash and pathname', () => {
    expect(
      resolveLocationPath({ pathname: '/a', search: '?x=1', hash: '#/b?y=2' })
    ).toBe('/b?y=2');
    expect(resolveLocationPath({ pathname: '/a', search: '?x=1' })).toBe('/a?x=1');
    expect(resolveLocationPath(undefined)).toBe('');
  });

  it('should resolve window path with hash mode preference', () => {
    const mockWindow = {
      location: {
        pathname: '/current',
        search: '?page=1',
        hash: '#/hash-route?tab=2',
      },
    };

    expect(resolveWindowPath(true, mockWindow)).toBe('/hash-route?tab=2');
    expect(resolveWindowPath(false, mockWindow)).toBe('/current?page=1');
  });

  it('should resolve preferred current path with defined priority', () => {
    const mockWindow = {
      location: {
        pathname: '/window',
        search: '?w=1',
        hash: '#/window-hash',
      },
    };

    expect(
      resolvePreferredCurrentPath({
        routerCurrentPath: '/router-current',
        currentPath: '/current',
        location: { pathname: '/location' },
        mode: 'history',
        targetWindow: mockWindow,
      })
    ).toBe('/router-current');

    expect(
      resolvePreferredCurrentPath({
        currentPath: '/current',
        location: { pathname: '/location' },
        mode: 'history',
        targetWindow: mockWindow,
      })
    ).toBe('/current');

    expect(
      resolvePreferredCurrentPath({
        location: { pathname: '/location', search: '?l=1' },
        mode: 'history',
        targetWindow: mockWindow,
      })
    ).toBe('/location?l=1');

    expect(
      resolvePreferredCurrentPath({
        mode: 'hash',
        targetWindow: mockWindow,
      })
    ).toBe('/window-hash');
  });

  it('should build layout preferences snapshot with user props priority', () => {
    const snapshot = buildLayoutPreferencesSnapshot(
      {
        layout: 'mixed-nav',
        theme: { mode: 'dark' },
        sidebar: { width: 280 },
        tabbar: { draggable: true },
      },
      {
        layout: 'header-nav',
        theme: { mode: 'light' },
        sidebar: { hidden: true },
        tabbar: { wheelable: true },
        footer: { fixed: true },
      }
    );

    expect(snapshot.layoutType).toBe('header-nav');
    expect(snapshot.themeMode).toBe('light');
    expect(snapshot.isDark).toBe(false);
    expect(snapshot.sidebarConfig).toMatchObject({ hidden: true });
    expect(snapshot.tabbarConfig).toMatchObject({ wheelable: true });
    expect(snapshot.footerConfig).toMatchObject({ fixed: true });
  });

  it('should dispatch shortcut actions', () => {
    const onLockScreen = vi.fn();
    const onLogout = vi.fn();
    const onGlobalSearch = vi.fn();

    expect(
      dispatchShortcutAction('globalLockScreen', {
        onLockScreen,
        onLogout,
        onGlobalSearch,
      })
    ).toBe(true);
    expect(onLockScreen).toHaveBeenCalledTimes(1);

    dispatchShortcutAction('globalLogout', { onLockScreen, onLogout, onGlobalSearch });
    expect(onLogout).toHaveBeenCalledTimes(1);

    dispatchShortcutAction('globalSearch', { onLockScreen, onLogout, onGlobalSearch });
    expect(onGlobalSearch).toHaveBeenCalledWith('');
  });
});
