import { getDefaultPreferences } from '@admin-core/preferences';
import { describe, expect, it, vi } from 'vitest';
import {
  createLayoutPreferencesSyncRuntime,
  mapLayoutPreferencesToProps,
  resolveAllLayoutCSSVariables,
  safeStartLayoutPreferencesSync,
  startLayoutPreferencesSync,
} from '../utils';

describe('layout-preferences-state helpers', () => {
  it('should map preferences to layout props', () => {
    const prefs = getDefaultPreferences();
    const props = mapLayoutPreferencesToProps(prefs);
    expect(props.layout).toBe(prefs.app.layout);
    expect(props.locale).toBe(prefs.app.locale);
  });

  it('should resolve all css variables from props and state', () => {
    const vars = resolveAllLayoutCSSVariables(
      {
        layout: 'sidebar-nav',
        sidebar: { width: 240 },
      },
      {
        sidebarCollapsed: false,
        sidebarExpandOnHovering: false,
        sidebarExtraVisible: false,
        sidebarExtraCollapsed: false,
        sidebarExpandOnHover: false,
        headerHidden: false,
        panelCollapsed: false,
        isFullscreen: false,
        openMenuKeys: [],
        mixedNavRootKey: '',
        contentScrollTop: 0,
        refreshKey: 0,
        keepAliveIncludes: [],
        keepAliveExcludes: [],
      }
    );

    expect(Object.keys(vars).length).toBeGreaterThan(0);
  });

  it('should sync preferences from manager', () => {
    type DemoPrefs = { layout: 'sidebar-nav' | 'header-nav'; locale: string };
    let current: DemoPrefs = { layout: 'sidebar-nav', locale: 'zh-CN' };
    const listeners = new Set<(prefs: DemoPrefs) => void>();

    const manager = {
      getPreferences: () => current,
      subscribe: (listener: (preferences: DemoPrefs) => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    };

    const onChange = vi.fn();
    const stop = startLayoutPreferencesSync({
      manager,
      map: (prefs: DemoPrefs) => ({ layout: prefs.layout, locale: prefs.locale }),
      onChange,
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ layout: 'sidebar-nav', locale: 'zh-CN' });

    current = { layout: 'header-nav', locale: 'en-US' };
    listeners.forEach((listener) => listener(current));
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith({ layout: 'header-nav', locale: 'en-US' });

    stop();
    expect(listeners.size).toBe(0);
  });

  it('should return null for safe sync when manager creation fails', () => {
    const stop = safeStartLayoutPreferencesSync({
      createManager: () => {
        throw new Error('not ready');
      },
      onChange: () => undefined,
    });
    expect(stop).toBeNull();
  });

  it('should manage preferences sync runtime lifecycle', () => {
    type DemoPrefs = { layout: 'sidebar-nav' | 'header-nav'; locale: string };
    let current: DemoPrefs = { layout: 'sidebar-nav', locale: 'zh-CN' };
    const listeners = new Set<(prefs: DemoPrefs) => void>();
    const unsubscribe = vi.fn();

    const manager = {
      getPreferences: () => current,
      subscribe: (listener: (preferences: DemoPrefs) => void) => {
        listeners.add(listener);
        return () => {
          unsubscribe();
          listeners.delete(listener);
        };
      },
    };

    const onChange = vi.fn();
    const runtime = createLayoutPreferencesSyncRuntime({
      createManager: () => manager,
      onChange,
      map: (prefs: DemoPrefs) => ({ layout: prefs.layout, locale: prefs.locale }),
    });

    runtime.start();
    expect(onChange).toHaveBeenCalledWith({ layout: 'sidebar-nav', locale: 'zh-CN' });
    expect(listeners.size).toBe(1);

    current = { layout: 'header-nav', locale: 'en-US' };
    listeners.forEach((listener) => listener(current));
    expect(onChange).toHaveBeenLastCalledWith({ layout: 'header-nav', locale: 'en-US' });

    runtime.restart();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(listeners.size).toBe(1);

    runtime.destroy();
    expect(unsubscribe).toHaveBeenCalledTimes(2);
    expect(listeners.size).toBe(0);
  });
});
