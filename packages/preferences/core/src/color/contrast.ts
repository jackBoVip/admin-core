/**
 * 对比度计算
 * @description 基于 WCAG 2.1 标准计算前景色
 */

import { parseToOklch } from './oklch';

/**
 * WCAG 对比度等级
 */
export type WCAGLevel = 'AA' | 'AAA';

/**
 * WCAG 最小对比度要求
 * - AA: 4.5:1 (普通文本), 3:1 (大文本)
 * - AAA: 7:1 (普通文本), 4.5:1 (大文本)
 */
const WCAG_CONTRAST_RATIO: Record<WCAGLevel, { normal: number; large: number }> = {
  AA: { normal: 4.5, large: 3 },
  AAA: { normal: 7, large: 4.5 },
};

/**
 * 亮度阈值：高于此值使用深色文字，低于此值使用浅色文字
 * @description 基于 OKLCH 亮度值 (0-1)，0.6 是经验值，平衡深浅色可读性
 */
const LIGHTNESS_THRESHOLD = 0.6;

/**
 * 暗色判断阈值
 * @description 低于此值认为是深色背景
 */
const DARK_BG_THRESHOLD = 0.5;

/**
 * 计算相对亮度
 * @description 基于 OKLCH 的亮度计算
 * @param color - 颜色字符串
 * @returns 相对亮度 (0-1)
 */
export function getRelativeLuminance(color: string): number {
  const oklch = parseToOklch(color);
  if (!oklch) return 0;

  // OKLCH 的 L 值是感知均匀的亮度
  // 转换为相对亮度（近似）
  return Math.pow(oklch.l, 2.4);
}

/**
 * 计算两个颜色的对比度
 * @param color1 - 颜色1
 * @param color2 - 颜色2
 * @returns 对比度 (1-21)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * 检查是否满足 WCAG 对比度要求
 * @param color1 - 颜色1
 * @param color2 - 颜色2
 * @param level - WCAG 等级
 * @param isLargeText - 是否为大文本
 * @returns 是否满足要求
 */
export function meetsWCAG(
  color1: string,
  color2: string,
  level: WCAGLevel = 'AA',
  isLargeText = false
): boolean {
  const ratio = getContrastRatio(color1, color2);
  const required = isLargeText ? WCAG_CONTRAST_RATIO[level].large : WCAG_CONTRAST_RATIO[level].normal;

  return ratio >= required;
}

/**
 * 获取对比色（前景色）
 * @description 基于背景色亮度自动选择深色或浅色文字
 * @param bgColor - 背景色
 * @returns 前景色
 */
export function getContrastColor(bgColor: string): string {
  const color = parseToOklch(bgColor);

  if (!color) {
    return 'oklch(0.1 0 0)'; // 默认深色
  }

  // 亮度高于阈值使用深色文字，低于阈值使用浅色文字
  return color.l > LIGHTNESS_THRESHOLD
    ? 'oklch(0.1 0 0)' // 深色文字
    : 'oklch(0.98 0 0)'; // 浅色文字
}

/**
 * 获取满足 WCAG 要求的前景色
 * @param bgColor - 背景色
 * @param level - WCAG 等级
 * @returns 满足对比度要求的前景色
 */
export function getAccessibleForeground(bgColor: string, level: WCAGLevel = 'AA'): string {
  const bgOklch = parseToOklch(bgColor);

  if (!bgOklch) {
    return 'oklch(0.1 0 0)';
  }

  // 尝试深色和浅色
  const darkText = 'oklch(0.1 0 0)';
  const lightText = 'oklch(0.98 0 0)';

  // 优先选择对比度更高的
  const darkRatio = getContrastRatio(bgColor, darkText);
  const lightRatio = getContrastRatio(bgColor, lightText);

  const required = WCAG_CONTRAST_RATIO[level].normal;

  // 选择满足要求且对比度更高的
  if (darkRatio >= required && darkRatio >= lightRatio) {
    return darkText;
  }
  if (lightRatio >= required) {
    return lightText;
  }

  // 如果都不满足，返回对比度更高的
  return darkRatio > lightRatio ? darkText : lightText;
}

/**
 * 生成一组对比色
 * @param bgColor - 背景色
 * @returns 前景色变体
 */
export function generateContrastColors(bgColor: string): {
  foreground: string;
  foregroundMuted: string;
} {
  const bg = parseToOklch(bgColor);

  if (!bg) {
    return {
      foreground: 'oklch(0.1 0 0)',
      foregroundMuted: 'oklch(0.4 0 0)',
    };
  }

  const isDark = bg.l < DARK_BG_THRESHOLD;

  return {
    foreground: isDark ? 'oklch(0.98 0 0)' : 'oklch(0.1 0 0)',
    foregroundMuted: isDark ? 'oklch(0.7 0.02 250)' : 'oklch(0.4 0.02 250)',
  };
}
