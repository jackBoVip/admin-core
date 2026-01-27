/**
 * 布局操作
 * @description 框架无关的布局相关业务逻辑
 */

import type { PreferencesManager } from '../manager/preferences-manager';
import type { DeepPartial, Preferences, LayoutType } from '../types';

/**
 * 布局操作接口
 */
export interface LayoutActions {
  /** 设置应用配置 */
  setApp: (updates: DeepPartial<Preferences['app']>) => void;
  /** 设置布局类型 */
  setLayout: (layout: LayoutType) => void;
  /** 设置侧边栏配置 */
  setSidebar: (updates: DeepPartial<Preferences['sidebar']>) => void;
  /** 设置头部配置 */
  setHeader: (updates: DeepPartial<Preferences['header']>) => void;
  /** 设置标签栏配置 */
  setTabbar: (updates: DeepPartial<Preferences['tabbar']>) => void;
  /** 设置底部配置 */
  setFooter: (updates: DeepPartial<Preferences['footer']>) => void;
  /** 设置面包屑配置 */
  setBreadcrumb: (updates: DeepPartial<Preferences['breadcrumb']>) => void;
  /** 切换侧边栏折叠状态 */
  toggleSidebarCollapsed: () => void;
  /** 设置侧边栏折叠状态 */
  setSidebarCollapsed: (collapsed: boolean) => void;
  /** 获取侧边栏是否折叠 */
  isSidebarCollapsed: () => boolean;
}

/**
 * 创建布局操作
 * @param manager - 偏好设置管理器实例
 * @returns 布局操作对象
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
