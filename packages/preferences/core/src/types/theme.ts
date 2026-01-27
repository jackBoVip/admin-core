/**
 * 主题相关类型定义
 * @description 定义主题模式、内置主题类型等
 */

/**
 * 主题模式
 * @description
 * - light: 浅色模式
 * - dark: 深色模式
 * - auto: 跟随系统
 */
export type ThemeModeType = 'auto' | 'dark' | 'light';

/**
 * 内置主题类型
 * @description 预设的主题色方案
 */
export type BuiltinThemeType =
  | 'custom'
  | 'deep-blue'
  | 'deep-green'
  | 'default'
  | 'gray'
  | 'green'
  | 'neutral'
  | 'orange'
  | 'pink'
  | 'rose'
  | 'sky-blue'
  | 'slate'
  | 'violet'
  | 'yellow'
  | 'zinc';

/**
 * 页面切换动画类型
 */
export type PageTransitionType =
  | 'fade'
  | 'fade-down'
  | 'fade-slide'
  | 'fade-up'
  | 'slide-left'
  | 'slide-right';

/**
 * 内置主题预设配置
 */
export interface BuiltinThemePreset {
  /** 预览色（用于选择器显示） */
  color: string;
  /** 暗色模式主色（可选） */
  darkPrimaryColor?: string;
  /** 主题类型标识 */
  type: BuiltinThemeType;
  /** i18n 名称键（对应 locale.theme.presetXxx） */
  nameKey: string;
}
