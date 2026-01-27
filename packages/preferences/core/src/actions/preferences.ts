/**
 * 偏好设置操作
 * @description 框架无关的偏好设置业务逻辑
 */

import type { PreferencesManager } from '../manager/preferences-manager';
import type { DeepPartial, Preferences } from '../types';

/**
 * 偏好设置操作接口
 */
export interface PreferencesActions {
  /** 更新偏好设置 */
  setPreferences: (updates: DeepPartial<Preferences>) => void;
  /** 重置偏好设置 */
  resetPreferences: (toDefault?: boolean) => void;
  /** 切换主题模式 */
  toggleTheme: () => void;
  /** 切换侧边栏折叠状态 */
  toggleSidebar: () => void;
  /** 获取当前实际主题模式 */
  getActualThemeMode: () => 'light' | 'dark';
  /** 导出配置 */
  exportConfig: () => string;
  /** 导入配置 */
  importConfig: (config: string | DeepPartial<Preferences>) => void;
}

/**
 * 创建偏好设置操作
 * @param manager - 偏好设置管理器实例
 * @returns 操作对象
 */
export function createPreferencesActions(manager: PreferencesManager): PreferencesActions {
  return {
    setPreferences: (updates: DeepPartial<Preferences>) => {
      manager.setPreferences(updates);
    },

    resetPreferences: (toDefault = true) => {
      manager.reset(toDefault);
    },

    toggleTheme: () => {
      manager.toggleThemeMode();
    },

    toggleSidebar: () => {
      manager.toggleSidebarCollapsed();
    },

    getActualThemeMode: () => {
      return manager.getActualThemeMode();
    },

    exportConfig: () => {
      return manager.exportConfig();
    },

    importConfig: (config: string | DeepPartial<Preferences>) => {
      manager.importConfig(config);
    },
  };
}
