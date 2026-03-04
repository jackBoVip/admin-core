/**
 * 主题预设常量
 * @description 使用 OKLCH 色彩空间定义的内置主题
 */

import type { BuiltinThemePreset, BuiltinThemeType } from '../types';

/**
 * 内置主题预设列表
 * @description 使用 OKLCH 色彩空间定义，所有语义色从主色自动派生
 */
export const BUILT_IN_THEME_PRESETS: BuiltinThemePreset[] = [
  /**
   * 彩色主题预设。
   */
  { color: 'oklch(0.55 0.2 250)', type: 'default', nameKey: 'presetDefault' },
  { color: 'oklch(0.55 0.22 290)', type: 'violet', nameKey: 'presetViolet' },
  { color: 'oklch(0.6 0.2 350)', type: 'pink', nameKey: 'presetPink' },
  { color: 'oklch(0.75 0.15 85)', type: 'yellow', nameKey: 'presetYellow' },
  { color: 'oklch(0.6 0.18 230)', type: 'sky-blue', nameKey: 'presetSkyBlue' },
  { color: 'oklch(0.6 0.18 145)', type: 'green', nameKey: 'presetGreen' },
  { color: 'oklch(0.5 0.15 180)', type: 'deep-green', nameKey: 'presetDeepGreen' },
  { color: 'oklch(0.45 0.2 250)', type: 'deep-blue', nameKey: 'presetDeepBlue' },
  { color: 'oklch(0.55 0.2 45)', type: 'orange', nameKey: 'presetOrange' },
  { color: 'oklch(0.5 0.22 25)', type: 'rose', nameKey: 'presetRose' },

  /**
   * 中性主题预设。
   * @description 暗色模式下可使用独立主色，以提升可读性。
   */
  {
    color: 'oklch(0.35 0.02 260)',
    darkPrimaryColor: 'oklch(0.98 0 0)',
    type: 'zinc',
    nameKey: 'presetZinc',
  },
  {
    color: 'oklch(0.3 0 0)',
    darkPrimaryColor: 'oklch(0.98 0 0)',
    type: 'neutral',
    nameKey: 'presetNeutral',
  },
  {
    color: 'oklch(0.35 0.03 250)',
    darkPrimaryColor: 'oklch(0.98 0 0)',
    type: 'slate',
    nameKey: 'presetSlate',
  },
  {
    color: 'oklch(0.35 0.01 250)',
    darkPrimaryColor: 'oklch(0.98 0 0)',
    type: 'gray',
    nameKey: 'presetGray',
  },

  /**
   * 自定义主题占位项。
   */
  { color: '', type: 'custom', nameKey: '' },
];

/**
 * 颜色预设（用于选择器显示）
 */
export const COLOR_PRESETS = BUILT_IN_THEME_PRESETS.slice(0, 10);

const BUILT_IN_THEME_MAP = new Map<BuiltinThemeType, BuiltinThemePreset>(
  BUILT_IN_THEME_PRESETS.map((preset) => [preset.type, preset])
);

/**
 * 获取内置主题配置
 * @param type - 主题类型
 * @returns 主题配置，不存在返回 undefined
 */
export function getBuiltinTheme(type: BuiltinThemeType): BuiltinThemePreset | undefined {
  return BUILT_IN_THEME_MAP.get(type);
}

/**
 * 根据主题类型和模式获取主色
 * @param type - 主题类型
 * @param isDark - 是否暗色模式
 * @returns 主色
 */
export function getThemePrimaryColor(type: BuiltinThemeType, isDark: boolean): string {
  const preset = getBuiltinTheme(type);
  if (!preset) {
    return 'oklch(0.55 0.2 250)';
  }

  /**
   * 暗色模式专用主色分支。
   * @description 对支持 `darkPrimaryColor` 的中性主题优先使用暗色主色。
   */
  if (isDark && preset.darkPrimaryColor) {
    return preset.darkPrimaryColor;
  }

  return preset.color;
}
