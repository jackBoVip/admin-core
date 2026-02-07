/**
 * Action 缓存工厂
 * @description 提供统一的 action 实例管理，避免 Vue/React 重复实现
 */

import { createLayoutActions, type LayoutActions } from './layout';
import { createPreferencesActions, type PreferencesActions } from './preferences';
import { createThemeActions, type ThemeActions } from './theme';
import type { PreferencesManager } from '../manager';

/**
 * Action 工厂返回类型
 */
export interface ActionFactory {
  /** 获取偏好设置 actions（缓存） */
  getPreferencesActions: () => PreferencesActions;
  /** 获取主题 actions（缓存） */
  getThemeActions: () => ThemeActions;
  /** 获取布局 actions（缓存） */
  getLayoutActions: () => LayoutActions;
  /** 清除所有缓存 */
  clearCache: () => void;
}

/**
 * 创建 Action 工厂
 * @description 缓存 action 实例，避免重复创建
 * @param getManager - 获取管理器的函数
 * @returns Action 工厂
 */
export function createActionFactory(getManager: () => PreferencesManager): ActionFactory {
  let cachedPreferencesActions: PreferencesActions | null = null;
  let cachedThemeActions: ThemeActions | null = null;
  let cachedLayoutActions: LayoutActions | null = null;

  return {
    getPreferencesActions() {
      if (!cachedPreferencesActions) {
        cachedPreferencesActions = createPreferencesActions(getManager());
      }
      return cachedPreferencesActions;
    },

    getThemeActions() {
      if (!cachedThemeActions) {
        cachedThemeActions = createThemeActions(getManager());
      }
      return cachedThemeActions;
    },

    getLayoutActions() {
      if (!cachedLayoutActions) {
        cachedLayoutActions = createLayoutActions(getManager());
      }
      return cachedLayoutActions;
    },

    clearCache() {
      cachedPreferencesActions = null;
      cachedThemeActions = null;
      cachedLayoutActions = null;
    },
  };
}

/**
 * 全局 Action 工厂缓存
 * @description 用于单例模式，Vue/React 可共享同一工厂
 */
let globalActionFactory: ActionFactory | null = null;

/**
 * 获取或创建全局 Action 工厂
 * @param getManager - 获取管理器的函数
 * @returns 全局 Action 工厂
 */
export function getGlobalActionFactory(getManager: () => PreferencesManager): ActionFactory {
  if (!globalActionFactory) {
    globalActionFactory = createActionFactory(getManager);
  }
  return globalActionFactory;
}

/**
 * 重置全局 Action 工厂
 * @description 在销毁管理器时调用
 */
export function resetGlobalActionFactory(): void {
  if (globalActionFactory) {
    globalActionFactory.clearCache();
    globalActionFactory = null;
  }
}
