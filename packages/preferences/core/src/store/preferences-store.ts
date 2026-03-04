/**
 * 默认偏好设置 Store
 * @description 统一管理生命周期与 actions 缓存，供 React/Vue 共享
 */

import { getGlobalActionFactory, resetGlobalActionFactory, type ActionFactory } from '../actions/factory';
import { getDefaultLifecycle, resetDefaultLifecycle, type ManagerLifecycle } from '../manager/lifecycle';
import type { PreferencesManager } from '../manager';
import type { Preferences, PreferencesInitOptions } from '../types';

/**
 * 偏好设置默认 Store 接口。
 */
export interface PreferencesStore {
  /** 生命周期控制器。 */
  lifecycle: ManagerLifecycle;
  /** 全局动作工厂。 */
  actions: ActionFactory;
  /** 初始化并返回偏好管理器。 */
  init: (options?: PreferencesInitOptions) => PreferencesManager;
  /** 获取已初始化的偏好管理器（未初始化会抛错）。 */
  getManager: () => PreferencesManager;
  /** 获取偏好管理器，未初始化时返回 `null`。 */
  getManagerOrNull: () => PreferencesManager | null;
  /** 当前是否已完成初始化。 */
  isInitialized: () => boolean;
  /** 销毁 store 与生命周期资源。 */
  destroy: () => void;
  /** 订阅偏好变更。 */
  subscribe: (callback: (prefs: Preferences, changedKeys: string[]) => void) => () => void;
  /** 读取当前偏好快照。 */
  getPreferences: () => Preferences | null;
}

let defaultStore: PreferencesStore | null = null;

/**
 * 获取默认 Store（单例）
 * @returns 默认偏好设置 Store 单例实例
 */
export function getDefaultPreferencesStore(): PreferencesStore {
  if (!defaultStore) {
    const lifecycle = getDefaultLifecycle();
    const actions = getGlobalActionFactory(() => lifecycle.get());
    defaultStore = {
      lifecycle,
      actions,
      init: (options?: PreferencesInitOptions) => lifecycle.init(options),
      getManager: () => lifecycle.get(),
      getManagerOrNull: () => lifecycle.getOrNull(),
      isInitialized: () => lifecycle.isInitialized(),
      destroy: () => {
        lifecycle.destroy();
        resetGlobalActionFactory();
      },
      subscribe: (callback) => lifecycle.subscribe(callback),
      getPreferences: () => lifecycle.getPreferences(),
    };
  }
  return defaultStore;
}

/**
 * 重置默认 Store（用于测试/重置）
 * @returns 无返回值
 */
export function resetDefaultPreferencesStore(): void {
  if (defaultStore) {
    defaultStore.destroy();
    defaultStore = null;
  }
  resetDefaultLifecycle();
  resetGlobalActionFactory();
}
