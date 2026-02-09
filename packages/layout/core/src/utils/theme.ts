/**
 * 主题工具函数
 * @description 用于处理主题相关的逻辑
 */

import type { ThemeConfig } from '../types';
import type { ThemePreferences, ThemeModeType } from '@admin-core/preferences';

/**
 * 获取当前主题模式
 * @param theme - 主题配置
 * @returns 当前主题模式
 */
export function getCurrentThemeMode(theme?: ThemePreferences | ThemeConfig): ThemeModeType {
  return theme?.mode === 'dark' ? 'dark' : 'light';
}

/**
 * 切换主题模式
 * @param current - 当前主题模式
 * @returns 切换后的主题模式
 */
export function toggleThemeMode(current: ThemeModeType): ThemeModeType {
  return current === 'dark' ? 'light' : 'dark';
}

/**
 * 判断是否为暗色主题
 * @param theme - 主题配置
 * @returns 是否为暗色主题
 */
export function isDarkTheme(theme?: ThemePreferences | ThemeConfig): boolean {
  return getCurrentThemeMode(theme) === 'dark';
}
