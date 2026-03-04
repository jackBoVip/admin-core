/**
 * 偏好设置操作集合。
 * @description 封装与具体框架无关的偏好中心业务行为。
 */

import type { PreferencesManager } from '../manager/preferences-manager';
import type { DeepPartial, Preferences } from '../types';

/**
 * 偏好设置操作接口定义。
 */
export interface PreferencesActions {
  /**
   * 增量更新偏好设置。
   * @param updates 待写入的偏好差量对象。
   * @returns 无返回值。
   */
  setPreferences: (updates: DeepPartial<Preferences>) => void;
  /**
   * 重置偏好设置。
   * @param toDefault 是否回退到默认值；`false` 时仅清理运行时变更。
   * @returns 无返回值。
   */
  resetPreferences: (toDefault?: boolean) => void;
  /**
   * 在亮色/暗色主题之间切换。
   * @returns 无返回值。
   */
  toggleTheme: () => void;
  /**
   * 切换侧边栏折叠状态。
   * @returns 无返回值。
   */
  toggleSidebar: () => void;
  /**
   * 获取当前实际主题模式。
   * @returns 解析后的主题模式（`light` 或 `dark`）。
   */
  getActualThemeMode: () => 'light' | 'dark';
  /**
   * 导出当前偏好配置为字符串。
   * @returns 可持久化或分享的配置文本。
   */
  exportConfig: () => string;
  /**
   * 导入偏好配置。
   * @param config 配置字符串或偏好对象差量。
   * @returns 无返回值。
   */
  importConfig: (config: string | DeepPartial<Preferences>) => void;
}

/**
 * 创建偏好设置操作对象。
 * @param manager 偏好设置管理器实例。
 * @returns 包含常用偏好操作的对象。
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
