/**
 * 主题操作
 * @description 框架无关的主题相关业务逻辑
 */

import type { PreferencesManager } from '../manager/preferences-manager';
import type { DeepPartial, Preferences, ThemeModeType, BuiltinThemeType } from '../types';

/**
 * 主题操作接口
 */
export interface ThemeActions {
  /** 设置主题配置 */
  setTheme: (updates: DeepPartial<Preferences['theme']>) => void;
  /** 设置主题模式 */
  setMode: (mode: ThemeModeType) => void;
  /** 设置主色调 */
  setPrimaryColor: (color: string) => void;
  /** 设置内置主题 */
  setBuiltinTheme: (type: BuiltinThemeType) => void;
  /** 设置圆角 */
  setRadius: (radius: string) => void;
  /** 切换主题模式 (light/dark) */
  toggleTheme: () => void;
  /** 获取当前实际主题模式 */
  getActualThemeMode: () => 'light' | 'dark';
}

/**
 * 创建主题操作
 * @param manager - 偏好设置管理器实例
 * @returns 主题操作对象
 */
export function createThemeActions(manager: PreferencesManager): ThemeActions {
  return {
    setTheme: (updates: DeepPartial<Preferences['theme']>) => {
      manager.setPreferences({ theme: updates });
    },

    setMode: (mode: ThemeModeType) => {
      manager.setPreferences({ theme: { mode } });
    },

    setPrimaryColor: (color: string) => {
      manager.setPreferences({
        theme: {
          colorPrimary: color,
          builtinType: 'custom',
        },
      });
    },

    setBuiltinTheme: (type: BuiltinThemeType) => {
      manager.setPreferences({
        theme: { builtinType: type },
      });
    },

    setRadius: (radius: string) => {
      manager.setPreferences({
        theme: { radius },
      });
    },

    toggleTheme: () => {
      manager.toggleThemeMode();
    },

    getActualThemeMode: () => {
      return manager.getActualThemeMode();
    },
  };
}
