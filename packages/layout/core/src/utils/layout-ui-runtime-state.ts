/**
 * UI 运行时状态公共工具
 * @description 提供 React/Vue 共用的刷新运行时控制逻辑
 */

import { resolveRefreshTarget } from './layout-ui-state';
import type { TabItem } from '../types';

export interface LayoutRefreshRuntimeOptions {
  getIsRefreshing: () => boolean;
  setIsRefreshing: (value: boolean) => void;
  triggerRefreshKey: () => void;
  getActiveTab?: () => TabItem | undefined;
  onTabRefresh?: (tab: TabItem, key: string) => void;
  onRefresh?: () => void;
  delayMs?: number;
}

export interface LayoutRefreshRuntimeController {
  refresh: () => Promise<boolean>;
  destroy: () => void;
}

export interface LayoutRefreshControllerOptions {
  getTabs: () => TabItem[] | undefined;
  getActiveTabKey: () => string | undefined;
  getCurrentPath: () => string | undefined;
  getIsRefreshing: () => boolean;
  setIsRefreshing: (value: boolean) => void;
  triggerRefreshKey: () => void;
  onTabRefresh?: (tab: TabItem, key: string) => void;
  onRefresh?: () => void;
  delayMs?: number;
}

export interface LayoutRefreshController {
  resolveActiveTarget: () => { activeKey: string; activeTab?: TabItem };
  refresh: () => Promise<boolean>;
  destroy: () => void;
}

/**
 * 创建刷新运行时控制器
 */
export function createLayoutRefreshRuntime(
  options: LayoutRefreshRuntimeOptions
): LayoutRefreshRuntimeController {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const delayMs = options.delayMs ?? 500;

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const refresh = async () => {
    if (options.getIsRefreshing()) return false;

    options.setIsRefreshing(true);
    try {
      options.triggerRefreshKey();
      const activeTab = options.getActiveTab?.();
      if (activeTab && options.onTabRefresh) {
        options.onTabRefresh(activeTab, activeTab.key);
      } else {
        options.onRefresh?.();
      }
    } finally {
      clearTimer();
      timer = setTimeout(() => {
        options.setIsRefreshing(false);
        timer = null;
      }, delayMs);
    }
    return true;
  };

  return {
    refresh,
    destroy: clearTimer,
  };
}

/**
 * 创建刷新控制器（包含 activeTab 推导 + 运行时刷新）
 */
export function createLayoutRefreshController(
  options: LayoutRefreshControllerOptions
): LayoutRefreshController {
  const resolveActiveTarget = () =>
    resolveRefreshTarget({
      tabs: options.getTabs(),
      activeTabKey: options.getActiveTabKey(),
      currentPath: options.getCurrentPath(),
    });

  const runtime = createLayoutRefreshRuntime({
    getIsRefreshing: options.getIsRefreshing,
    setIsRefreshing: options.setIsRefreshing,
    triggerRefreshKey: options.triggerRefreshKey,
    getActiveTab: () => resolveActiveTarget().activeTab,
    onTabRefresh: options.onTabRefresh,
    onRefresh: options.onRefresh,
    delayMs: options.delayMs,
  });

  return {
    resolveActiveTarget,
    refresh: runtime.refresh,
    destroy: runtime.destroy,
  };
}
