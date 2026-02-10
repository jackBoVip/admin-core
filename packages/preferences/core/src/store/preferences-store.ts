/**
 * 默认偏好设置 Store
 * @description 统一管理生命周期与 actions 缓存，供 React/Vue 共享
 */

import { getGlobalActionFactory, resetGlobalActionFactory, type ActionFactory } from '../actions/factory';
import { getDefaultLifecycle, resetDefaultLifecycle, type ManagerLifecycle } from '../manager/lifecycle';
import type { PreferencesManager } from '../manager';
import type { Preferences, PreferencesInitOptions } from '../types';

export interface PreferencesStore {
  lifecycle: ManagerLifecycle;
  actions: ActionFactory;
  init: (options?: PreferencesInitOptions) => PreferencesManager;
  getManager: () => PreferencesManager;
  getManagerOrNull: () => PreferencesManager | null;
  isInitialized: () => boolean;
  destroy: () => void;
  subscribe: (callback: (prefs: Preferences, changedKeys: string[]) => void) => () => void;
  getPreferences: () => Preferences | null;
}

let defaultStore: PreferencesStore | null = null;

/**
 * 获取默认 Store（单例）
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
 */
export function resetDefaultPreferencesStore(): void {
  if (defaultStore) {
    defaultStore.destroy();
    defaultStore = null;
  }
  resetDefaultLifecycle();
  resetGlobalActionFactory();
}
