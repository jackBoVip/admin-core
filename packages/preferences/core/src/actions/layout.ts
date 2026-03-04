/**
 * 布局操作集合。
 * @description 提供与框架无关的布局偏好写入与状态查询能力。
 */

import type { PreferencesManager } from '../manager/preferences-manager';
import type { DeepPartial, Preferences, LayoutType } from '../types';

/**
 * 布局操作接口定义。
 */
export interface LayoutActions {
  /**
   * 更新应用级布局配置。
   * @param updates 应用配置差量。
   * @returns 无返回值。
   */
  setApp: (updates: DeepPartial<Preferences['app']>) => void;
  /**
   * 设置全局布局模式。
   * @param layout 目标布局类型。
   * @returns 无返回值。
   */
  setLayout: (layout: LayoutType) => void;
  /**
   * 更新侧边栏配置。
   * @param updates 侧边栏配置差量。
   * @returns 无返回值。
   */
  setSidebar: (updates: DeepPartial<Preferences['sidebar']>) => void;
  /**
   * 更新顶栏配置。
   * @param updates 顶栏配置差量。
   * @returns 无返回值。
   */
  setHeader: (updates: DeepPartial<Preferences['header']>) => void;
  /**
   * 更新标签栏配置。
   * @param updates 标签栏配置差量。
   * @returns 无返回值。
   */
  setTabbar: (updates: DeepPartial<Preferences['tabbar']>) => void;
  /**
   * 更新页脚配置。
   * @param updates 页脚配置差量。
   * @returns 无返回值。
   */
  setFooter: (updates: DeepPartial<Preferences['footer']>) => void;
  /**
   * 更新面包屑配置。
   * @param updates 面包屑配置差量。
   * @returns 无返回值。
   */
  setBreadcrumb: (updates: DeepPartial<Preferences['breadcrumb']>) => void;
  /**
   * 切换侧边栏折叠状态。
   * @returns 无返回值。
   */
  toggleSidebarCollapsed: () => void;
  /**
   * 直接设置侧边栏折叠状态。
   * @param collapsed 目标折叠状态。
   * @returns 无返回值。
   */
  setSidebarCollapsed: (collapsed: boolean) => void;
  /**
   * 获取当前侧边栏折叠状态。
   * @returns 已折叠返回 `true`，否则返回 `false`。
   */
  isSidebarCollapsed: () => boolean;
}

/**
 * 创建布局操作对象。
 * @param manager 偏好设置管理器实例。
 * @returns 布局操作对象。
 */
export function createLayoutActions(manager: PreferencesManager): LayoutActions {
  return {
    setApp: (updates: DeepPartial<Preferences['app']>) => {
      manager.setPreferences({ app: updates });
    },

    setLayout: (layout: LayoutType) => {
      manager.setPreferences({ app: { layout } });
    },

    setSidebar: (updates: DeepPartial<Preferences['sidebar']>) => {
      manager.setPreferences({ sidebar: updates });
    },

    setHeader: (updates: DeepPartial<Preferences['header']>) => {
      manager.setPreferences({ header: updates });
    },

    setTabbar: (updates: DeepPartial<Preferences['tabbar']>) => {
      manager.setPreferences({ tabbar: updates });
    },

    setFooter: (updates: DeepPartial<Preferences['footer']>) => {
      manager.setPreferences({ footer: updates });
    },

    setBreadcrumb: (updates: DeepPartial<Preferences['breadcrumb']>) => {
      manager.setPreferences({ breadcrumb: updates });
    },

    toggleSidebarCollapsed: () => {
      manager.toggleSidebarCollapsed();
    },

    setSidebarCollapsed: (collapsed: boolean) => {
      manager.setPreferences({ sidebar: { collapsed } });
    },

    isSidebarCollapsed: () => {
      return manager.get('sidebar').collapsed;
    },
  };
}
