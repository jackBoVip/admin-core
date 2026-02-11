import { describe, expect, it, vi } from 'vitest';
import { createLayoutRefreshController, createLayoutRefreshRuntime } from '../utils';

describe('layout-ui-runtime-state helpers', () => {
  it('should trigger tab refresh and reset refreshing state', async () => {
    vi.useFakeTimers();

    const state = {
      isRefreshing: false,
      refreshKey: 0,
    };

    const onTabRefresh = vi.fn();
    const onRefresh = vi.fn();

    const runtime = createLayoutRefreshRuntime({
      getIsRefreshing: () => state.isRefreshing,
      setIsRefreshing: (value) => {
        state.isRefreshing = value;
      },
      triggerRefreshKey: () => {
        state.refreshKey += 1;
      },
      getActiveTab: () => ({
        key: '/system/users',
        name: '用户管理',
        path: '/system/users',
      }),
      onTabRefresh,
      onRefresh,
      delayMs: 500,
    });

    await runtime.refresh();
    expect(state.refreshKey).toBe(1);
    expect(state.isRefreshing).toBe(true);
    expect(onTabRefresh).toHaveBeenCalledTimes(1);
    expect(onRefresh).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(state.isRefreshing).toBe(false);

    runtime.destroy();
    vi.useRealTimers();
  });

  it('should fallback to onRefresh without active tab', async () => {
    vi.useFakeTimers();

    const state = {
      isRefreshing: false,
      refreshKey: 0,
    };

    const onTabRefresh = vi.fn();
    const onRefresh = vi.fn();

    const runtime = createLayoutRefreshRuntime({
      getIsRefreshing: () => state.isRefreshing,
      setIsRefreshing: (value) => {
        state.isRefreshing = value;
      },
      triggerRefreshKey: () => {
        state.refreshKey += 1;
      },
      getActiveTab: () => undefined,
      onTabRefresh,
      onRefresh,
      delayMs: 300,
    });

    await runtime.refresh();
    expect(state.refreshKey).toBe(1);
    expect(onTabRefresh).not.toHaveBeenCalled();
    expect(onRefresh).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(300);
    expect(state.isRefreshing).toBe(false);

    runtime.destroy();
    vi.useRealTimers();
  });

  it('should ignore reentry while refreshing', async () => {
    vi.useFakeTimers();

    const state = {
      isRefreshing: true,
      refreshKey: 0,
    };

    const onRefresh = vi.fn();

    const runtime = createLayoutRefreshRuntime({
      getIsRefreshing: () => state.isRefreshing,
      setIsRefreshing: (value) => {
        state.isRefreshing = value;
      },
      triggerRefreshKey: () => {
        state.refreshKey += 1;
      },
      onRefresh,
      delayMs: 300,
    });

    await expect(runtime.refresh()).resolves.toBe(false);
    expect(state.refreshKey).toBe(0);
    expect(onRefresh).not.toHaveBeenCalled();

    runtime.destroy();
    vi.useRealTimers();
  });

  it('should resolve active tab via refresh controller', async () => {
    vi.useFakeTimers();

    const state = {
      isRefreshing: false,
      refreshKey: 0,
      activeTabKey: '/analysis',
      currentPath: '/analysis',
      tabs: [
        { key: '/workbench', name: '工作台', path: '/workbench' },
        { key: '/analysis', name: '分析页', path: '/analysis' },
      ],
    };

    const onTabRefresh = vi.fn();
    const controller = createLayoutRefreshController({
      getTabs: () => state.tabs,
      getActiveTabKey: () => state.activeTabKey,
      getCurrentPath: () => state.currentPath,
      getIsRefreshing: () => state.isRefreshing,
      setIsRefreshing: (value) => {
        state.isRefreshing = value;
      },
      triggerRefreshKey: () => {
        state.refreshKey += 1;
      },
      onTabRefresh,
      delayMs: 300,
    });

    expect(controller.resolveActiveTarget().activeTab?.key).toBe('/analysis');
    await controller.refresh();
    expect(state.refreshKey).toBe(1);
    expect(onTabRefresh).toHaveBeenCalledTimes(1);

    controller.destroy();
    vi.useRealTimers();
  });
});
