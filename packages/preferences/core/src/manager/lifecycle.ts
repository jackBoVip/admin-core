/**
 * Manager 生命周期管理。
 * @description 封装框架无关的 Manager 创建、获取、销毁与订阅逻辑。
 */

import { WARN_MESSAGES, ERROR_MESSAGES } from '../constants/messages';
import { logger } from '../utils/logger';
import { createPreferencesManager, type PreferencesManager } from './preferences-manager';
import type { PreferencesInitOptions, Preferences } from '../types';

/**
 * Manager 生命周期管理器。
 * @description 统一管理 Manager 实例生命周期，供 Vue/React 适配层复用。
 */
export class ManagerLifecycle {
  private manager: PreferencesManager | null = null;
  private subscribers: Set<(prefs: Preferences, changedKeys: string[]) => void> = new Set();

  /**
   * 初始化 Manager。
   * @param options 初始化选项。
   * @returns `PreferencesManager` 实例。
   */
  init(options?: PreferencesInitOptions): PreferencesManager {
    if (this.manager) {
      logger.warn(WARN_MESSAGES.managerAlreadyInitialized);
      return this.manager;
    }

    this.manager = createPreferencesManager(options);

    /**
     * 转发底层管理器变更事件。
     * @description 将 manager 的更新广播给生命周期管理器的全部订阅者。
     */
    this.manager.subscribe((prefs, changedKeys) => {
      this.subscribers.forEach((callback) => callback(prefs as Preferences, changedKeys));
    });

    this.manager.init();

    return this.manager;
  }

  /**
   * 获取 Manager 实例。
   * @returns 已初始化的偏好设置管理器实例。
   * @throws 如果未初始化则抛出错误。
   */
  get(): PreferencesManager {
    if (!this.manager) {
      throw new Error(ERROR_MESSAGES.managerNotInitialized);
    }
    return this.manager;
  }

  /**
   * 获取 Manager 实例（可能为 `null`）。
   * @returns 已初始化时返回实例；未初始化返回 `null`。
   */
  getOrNull(): PreferencesManager | null {
    return this.manager;
  }

  /**
   * 检查是否已初始化。
   * @returns 是否已经调用过 `init` 且管理器仍有效。
   */
  isInitialized(): boolean {
    return this.manager !== null;
  }

  /**
   * 销毁 Manager。
   * @returns 无返回值。
   */
  destroy(): void {
    if (this.manager) {
      this.manager.destroy();
      this.manager = null;
      this.subscribers.clear();
    }
  }

  /**
   * 订阅偏好设置变更。
   * @param callback 变更回调。
   * @returns 取消订阅函数。
   */
  subscribe(callback: (prefs: Preferences, changedKeys: string[]) => void): () => void;
  subscribe(callback: () => void): () => void;
  subscribe(callback: ((prefs: Preferences, changedKeys: string[]) => void) | (() => void)): () => void {
    this.subscribers.add(callback as (prefs: Preferences, changedKeys: string[]) => void);
    return () => {
      this.subscribers.delete(callback as (prefs: Preferences, changedKeys: string[]) => void);
    };
  }

  /**
   * 获取当前偏好设置。
   * @returns 当前偏好设置快照；未初始化时返回 `null`。
   */
  getPreferences(): Preferences | null {
    return this.manager?.getPreferences() as Preferences | null;
  }
}

/**
 * 创建 Manager 生命周期管理器。
 * @returns 新的生命周期管理器实例。
 */
export function createManagerLifecycle(): ManagerLifecycle {
  return new ManagerLifecycle();
}

/**
 * 全局默认生命周期管理器（单例）
 */
let defaultLifecycle: ManagerLifecycle | null = null;

/**
 * 获取全局默认生命周期管理器。
 * @returns 全局单例生命周期管理器。
 */
export function getDefaultLifecycle(): ManagerLifecycle {
  if (!defaultLifecycle) {
    defaultLifecycle = new ManagerLifecycle();
  }
  return defaultLifecycle;
}

/**
 * 重置全局默认生命周期管理器（用于测试）。
 * @returns 无返回值。
 */
export function resetDefaultLifecycle(): void {
  if (defaultLifecycle) {
    defaultLifecycle.destroy();
    defaultLifecycle = null;
  }
}
