/**
 * 主题操作集合。
 * @description 提供与框架无关的主题偏好写入与主题态查询能力。
 */

import type { PreferencesManager } from '../manager/preferences-manager';
import type { DeepPartial, Preferences, ThemeModeType, BuiltinThemeType } from '../types';

/**
 * 主题操作接口定义。
 */
export interface ThemeActions {
  /**
   * 批量更新主题配置。
   * @param updates 主题配置差量。
   * @returns 无返回值。
   */
  setTheme: (updates: DeepPartial<Preferences['theme']>) => void;
  /**
   * 设置主题模式。
   * @param mode 主题模式值。
   * @returns 无返回值。
   */
  setMode: (mode: ThemeModeType) => void;
  /**
   * 设置主色并自动切换为自定义主题。
   * @param color 主色值（建议使用十六进制或 OKLCH）。
   * @returns 无返回值。
   */
  setPrimaryColor: (color: string) => void;
  /**
   * 切换内置主题预设。
   * @param type 目标内置主题类型。
   * @returns 无返回值。
   */
  setBuiltinTheme: (type: BuiltinThemeType) => void;
  /**
   * 设置全局圆角。
   * @param radius 圆角值（如 `0.5rem`）。
   * @returns 无返回值。
   */
  setRadius: (radius: string) => void;
  /**
   * 在亮色/暗色主题之间切换。
   * @returns 无返回值。
   */
  toggleTheme: () => void;
  /**
   * 获取当前实际主题模式。
   * @returns 解析后的实际主题模式（`light` 或 `dark`）。
   */
  getActualThemeMode: () => 'light' | 'dark';
}

/**
 * 创建主题操作对象。
 * @param manager 偏好设置管理器实例。
 * @returns 主题操作对象。
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
