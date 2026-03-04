/**
 * 主题相关类型定义。
 * @description 定义主题模式、内置主题标识与过渡动画类型。
 */

/**
 * 主题模式。
 * @description
 * - `light`: 浅色模式。
 * - `dark`: 深色模式。
 * - `auto`: 跟随系统主题。
 */
export type ThemeModeType = 'auto' | 'dark' | 'light';

/**
 * 内置主题类型。
 * @description 预设主题色方案标识；`custom` 表示用户自定义主色。
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
 * 页面切换动画类型。
 * @description 用于布局内容切换时的过渡动画风格。
 */
export type PageTransitionType =
  | 'fade'
  | 'fade-down'
  | 'fade-slide'
  | 'fade-up'
  | 'slide-left'
  | 'slide-right';

/**
 * 内置主题预设配置。
 * @description 描述主题预设卡片展示信息与实际主题主色映射关系。
 */
export interface BuiltinThemePreset {
  /** 预览色（用于主题选择器卡片展示）。 */
  color: string;
  /** 暗色模式主色（可选，未传则沿用 `color` 或默认策略）。 */
  darkPrimaryColor?: string;
  /** 主题类型标识。 */
  type: BuiltinThemeType;
  /** 国际化名称键（对应 `locale.theme.presetXxx`）。 */
  nameKey: string;
}
