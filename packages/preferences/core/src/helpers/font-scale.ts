/**
 * 字体缩放工具
 * @description 全局字体缩放功能，基于 CSS 变量实现高性能缩放
 *
 * 设计原理：
 * 1. 使用 CSS 变量 --font-scale 存储缩放因子
 * 2. 在 :root 上设置 font-size: calc(16px * var(--font-scale))
 * 3. 所有使用 rem 单位的元素自动缩放
 * 4. 使用 slider 控件调整，支持实时预览
 */

/**
 * 字体缩放配置
 */
export interface FontScaleConfig {
  /** 最小缩放比例 */
  min: number;
  /** 最大缩放比例 */
  max: number;
  /** 默认缩放比例 */
  default: number;
  /** 步进值 */
  step: number;
  /** 基准字体大小 (px) */
  baseFontSize: number;
}

/**
 * 默认字体缩放配置
 */
export const FONT_SCALE_CONFIG: FontScaleConfig = {
  min: 0.8,
  max: 1.4,
  default: 1.0,
  step: 0.05,
  baseFontSize: 16,
};

/**
 * 菜单字体大小相关常量
 */
export const MENU_FONT_CONFIG = {
  /** 菜单字体与基准字体的偏移量 (px) */
  OFFSET_FROM_BASE: 2,
  /** 菜单字体最小值 (px) */
  MIN_SIZE: 12,
} as const;

/**
 * 预设的字体缩放选项（用于快捷选择）
 */
export const FONT_SCALE_PRESETS = [
  { label: '80%', value: 0.8 },
  { label: '90%', value: 0.9 },
  { label: '100%', value: 1.0 },
  { label: '110%', value: 1.1 },
  { label: '120%', value: 1.2 },
  { label: '130%', value: 1.3 },
  { label: '140%', value: 1.4 },
] as const;

/**
 * 字体缩放 CSS 变量名
 */
export const FONT_SCALE_CSS_VAR = '--font-scale';
export const FONT_SIZE_BASE_CSS_VAR = '--font-size-base';

/**
 * 格式化缩放比例为百分比显示
 * @param scale - 缩放比例 (如 1.0, 1.2)
 * @returns 百分比字符串 (如 "100%", "120%")
 */
export function formatScaleToPercent(scale: number): string {
  return `${Math.round(scale * 100)}%`;
}

/**
 * 将百分比转换为缩放比例
 * @param percent - 百分比值 (如 100, 120)
 * @returns 缩放比例 (如 1.0, 1.2)
 */
export function percentToScale(percent: number): number {
  return percent / 100;
}

/**
 * 计算实际字体大小
 * @param scale - 缩放比例
 * @param baseFontSize - 基准字体大小 (默认 16px)
 * @returns 实际字体大小 (px)
 */
export function calculateFontSize(scale: number, baseFontSize = FONT_SCALE_CONFIG.baseFontSize): number {
  return Math.round(baseFontSize * scale * 100) / 100;
}

/**
 * 生成字体缩放 CSS 变量
 * @param scale - 缩放比例
 * @returns CSS 变量对象
 */
export function generateFontScaleVariables(scale: number): Record<string, string> {
  const baseFontSize = FONT_SCALE_CONFIG.baseFontSize;
  const actualSize = calculateFontSize(scale, baseFontSize);
  const menuSize = Math.max(
    actualSize - MENU_FONT_CONFIG.OFFSET_FROM_BASE,
    MENU_FONT_CONFIG.MIN_SIZE
  );

  return {
    [FONT_SCALE_CSS_VAR]: scale.toString(),
    [FONT_SIZE_BASE_CSS_VAR]: `${actualSize}px`,
    '--menu-font-size': `${menuSize}px`,
  };
}

/**
 * 验证缩放比例是否在有效范围内
 * @param scale - 缩放比例
 * @returns 修正后的缩放比例
 */
export function clampFontScale(scale: number): number {
  return Math.max(FONT_SCALE_CONFIG.min, Math.min(FONT_SCALE_CONFIG.max, scale));
}

/**
 * 将缩放比例格式化为步进精度
 * @param scale - 缩放比例
 * @returns 格式化后的缩放比例
 */
export function roundToStep(scale: number): number {
  const step = FONT_SCALE_CONFIG.step;
  return Math.round(scale / step) * step;
}
