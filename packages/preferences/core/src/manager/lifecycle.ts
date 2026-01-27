/**
 * Manager 生命周期管理
 * @description 框架无关的 Manager 生命周期逻辑
 */

import { createPreferencesManager, type PreferencesManager } from './preferences-manager';
import type { PreferencesInitOptions, Preferences } from '../types';
import { WARN_MESSAGES, ERROR_MESSAGES } from '../constants/messages';
import { logger } from '../utils/logger';

/**
 * Manager 生命周期管理器
 * @description 封装 Manager 的创建、获取、销毁逻辑，供 Vue/React 包使用
 */
export class ManagerLifecycle {
  private manager: PreferencesManager | null = null;
  private subscribers: Set<(prefs: Preferences) => void> = new Set();

  /**
   * 初始化 Manager
   * @param options - 初始化选项
   * @returns PreferencesManager 实例
   */
  init(options?: PreferencesInitOptions): PreferencesManager {
    if (this.manager) {
      logger.warn(WARN_MESSAGES.managerAlreadyInitialized);
      return this.manager;
    }

    this.manager = createPreferencesManager(options);

    // 订阅变更并转发给所有订阅者
    this.manager.subscribe((prefs) => {
      this.subscribers.forEach((callback) => callback(prefs as Preferences));
    });

    this.manager.init();

    return this.manager;
  }

  /**
   * 获取 Manager 实例
   * @throws 如果未初始化则抛出错误
   */
  get(): PreferencesManager {
    if (!this.manager) {
      throw new Error(ERROR_MESSAGES.managerNotInitialized);
    }
    return this.manager;
  }

  /**
   * 获取 Manager 实例（可能为 null）
   */
  getOrNull(): PreferencesManager | null {
    return this.manager;
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.manager !== null;
  }

  /**
   * 销毁 Manager
   */
  destroy(): void {
    if (this.manager) {
      this.manager.destroy();
      this.manager = null;
      this.subscribers.clear();
    }
  }

  /**
   * 订阅偏好设置变更
   * @param callback - 变更回调
   * @returns 取消订阅函数
   */
  subscribe(callback: (prefs: Preferences) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * 获取当前偏好设置
   */
  getPreferences(): Preferences | null {
    return this.manager?.getPreferences() as Preferences | null;
  }
}

/**
 * 创建 Manager 生命周期管理器
 */
export function createManagerLifecycle(): ManagerLifecycle {
  return new ManagerLifecycle();
}

/**
 * 全局默认生命周期管理器（单例）
 */
let defaultLifecycle: ManagerLifecycle | null = null;

/**
 * 获取全局默认生命周期管理器
 */
export function getDefaultLifecycle(): ManagerLifecycle {
  if (!defaultLifecycle) {
    defaultLifecycle = new ManagerLifecycle();
  }
  return defaultLifecycle;
}

/**
 * 重置全局默认生命周期管理器（用于测试）
 */
export function resetDefaultLifecycle(): void {
  if (defaultLifecycle) {
    defaultLifecycle.destroy();
    defaultLifecycle = null;
  }
}
