/**
 * UI 运行时状态公共工具。
 * @description 提供 React/Vue 共用的刷新状态控制与激活目标解析逻辑。
 */

import { resolveRefreshTarget } from './layout-ui-state';
import type { TabItem } from '../types';

/**
 * 刷新运行时选项。
 * @description 定义刷新过程依赖的状态访问器、事件回调与延迟策略。
 */
export interface LayoutRefreshRuntimeOptions {
  /** 获取是否正在刷新。 */
  getIsRefreshing: () => boolean;
  /** 设置刷新状态。 */
  setIsRefreshing: (value: boolean) => void;
  /** 触发刷新 key 变更。 */
  triggerRefreshKey: () => void;
  /** 获取当前激活标签。 */
  getActiveTab?: () => TabItem | undefined;
  /** 刷新激活标签时触发。 */
  onTabRefresh?: (tab: TabItem, key: string) => void;
  /** 触发通用刷新动作时回调。 */
  onRefresh?: () => void;
  /** 刷新结束延迟毫秒。 */
  delayMs?: number;
}

/**
 * 刷新运行时控制器。
 * @description 提供刷新触发与资源销毁能力。
 */
export interface LayoutRefreshRuntimeController {
  /** 触发刷新。 */
  refresh: () => Promise<boolean>;
  /** 销毁控制器。 */
  destroy: () => void;
}

/**
 * 刷新控制器选项。
 * @description 在运行时选项基础上补充标签与路由读取能力。
 */
export interface LayoutRefreshControllerOptions {
  /** 获取标签列表。 */
  getTabs: () => TabItem[] | undefined;
  /** 获取当前激活标签 key。 */
  getActiveTabKey: () => string | undefined;
  /** 获取当前路由路径。 */
  getCurrentPath: () => string | undefined;
  /** 获取刷新状态。 */
  getIsRefreshing: () => boolean;
  /** 设置刷新状态。 */
  setIsRefreshing: (value: boolean) => void;
  /** 触发刷新 key 变更。 */
  triggerRefreshKey: () => void;
  /** 刷新激活标签时触发。 */
  onTabRefresh?: (tab: TabItem, key: string) => void;
  /** 触发通用刷新动作时回调。 */
  onRefresh?: () => void;
  /** 刷新结束延迟毫秒。 */
  delayMs?: number;
}

/**
 * 刷新控制器。
 * @description 统一封装激活目标解析与刷新触发，供布局层直接调用。
 */
export interface LayoutRefreshController {
  /**
   * 解析当前激活目标。
   * @returns 激活目标信息。
   */
  resolveActiveTarget: () => LayoutRefreshActiveTarget;
  /** 触发刷新。 */
  refresh: () => Promise<boolean>;
  /** 销毁控制器。 */
  destroy: () => void;
}

/**
 * 刷新时的激活目标信息。
 * @description 描述当前应被刷新的标签页定位结果。
 */
export interface LayoutRefreshActiveTarget {
  /** 当前激活 key。 */
  activeKey: string;
  /** 当前激活标签。 */
  activeTab?: TabItem;
}

/**
 * 创建刷新运行时控制器。
 * @param options 刷新运行时参数。
 * @returns 刷新运行时控制器。
 */
export function createLayoutRefreshRuntime(
  options: LayoutRefreshRuntimeOptions
): LayoutRefreshRuntimeController {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const delayMs = options.delayMs ?? 500;

  /**
   * 清理挂起的刷新结束定时器。
   */
  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  /**
   * 触发刷新并在延迟后复位刷新状态。
   * @returns 是否成功启动本次刷新。
   */
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
 * 创建刷新控制器（包含 activeTab 推导 + 运行时刷新）。
 * @param options 刷新控制器参数。
 * @returns 刷新控制器。
 */
export function createLayoutRefreshController(
  options: LayoutRefreshControllerOptions
): LayoutRefreshController {
  /**
   * 解析当前激活刷新目标（activeKey + activeTab）。
   * @returns 激活目标信息。
   */
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
