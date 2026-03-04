/**
 * 对比度计算工具。
 * @description 基于 WCAG 2.1 标准评估颜色可读性，并生成可访问前景色。
 */

import { parseToOklch } from './oklch';

/**
 * 基于背景色推导的前景色集合。
 */
export interface ContrastColorSet {
  /** 主前景色。 */
  foreground: string;
  /** 弱化前景色。 */
  foregroundMuted: string;
}

/**
 * WCAG 对比度等级
 * @description 用于区分不同无障碍合规等级下的最小对比度阈值。
 */
export type WCAGLevel = 'AA' | 'AAA';

/**
 * WCAG 最小对比度要求
 * @description 定义不同等级在普通文本与大文本场景下的最小对比值。
 * - AA: 4.5:1 (普通文本), 3:1 (大文本)
 * - AAA: 7:1 (普通文本), 4.5:1 (大文本)
 */
const WCAG_CONTRAST_RATIO: Record<WCAGLevel, {
  /** 普通文本最小对比度。 */
  normal: number;
  /** 大文本最小对比度。 */
  large: number;
}> = {
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
 * 计算相对亮度。
 * @description 基于 OKLCH 的亮度计算
 * @param color - 颜色字符串
 * @returns 相对亮度 (0-1)
 */
export function getRelativeLuminance(color: string): number {
  const oklch = parseToOklch(color);
  if (!oklch) return 0;

  /* OKLCH 的 L 值是感知均匀的亮度，这里转换为近似相对亮度。 */
  return Math.pow(oklch.l, 2.4);
}

/**
 * 计算两个颜色的对比度。
 * @description 返回值范围通常为 `1-21`，值越大表示可读性差异越强。
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
 * 检查是否满足 WCAG 对比度要求。
 * @description 可按等级与文本尺寸校验当前配色是否达到无障碍可读标准。
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
 * 获取对比色（前景色）。
 * @description 基于背景色亮度自动选择深色或浅色文字
 * @param bgColor - 背景色
 * @returns 前景色
 */
export function getContrastColor(bgColor: string): string {
  const color = parseToOklch(bgColor);

  if (!color) {
    /* 默认深色文字，避免颜色解析失败时出现可读性问题。 */
    return 'oklch(0.1 0 0)';
  }

  /* 亮度高于阈值使用深色文字，低于阈值使用浅色文字。 */
  return color.l > LIGHTNESS_THRESHOLD
    ? 'oklch(0.1 0 0)'
    : 'oklch(0.98 0 0)';
}

/**
 * 获取满足 WCAG 要求的前景色。
 * @description 在深色与浅色候选中选择对比度更高且尽量达标的一项。
 * @param bgColor - 背景色
 * @param level - WCAG 等级
 * @returns 满足对比度要求的前景色
 */
export function getAccessibleForeground(bgColor: string, level: WCAGLevel = 'AA'): string {
  const bgOklch = parseToOklch(bgColor);

  if (!bgOklch) {
    return 'oklch(0.1 0 0)';
  }

  /* 尝试深色与浅色两套候选前景色。 */
  const darkText = 'oklch(0.1 0 0)';
  const lightText = 'oklch(0.98 0 0)';

  /* 优先选择对比度更高的一侧。 */
  const darkRatio = getContrastRatio(bgColor, darkText);
  const lightRatio = getContrastRatio(bgColor, lightText);

  const required = WCAG_CONTRAST_RATIO[level].normal;

  /* 选择满足 WCAG 要求且对比度更高的候选项。 */
  if (darkRatio >= required && darkRatio >= lightRatio) {
    return darkText;
  }
  if (lightRatio >= required) {
    return lightText;
  }

  /* 若都未达标，则返回对比度更高的一项作为兜底。 */
  return darkRatio > lightRatio ? darkText : lightText;
}

/**
 * 生成一组对比色。
 * @description 输出主前景色与弱化前景色，便于文本与次级信息配色统一。
 * @param bgColor - 背景色
 * @returns 前景色变体
 */
export function generateContrastColors(bgColor: string): ContrastColorSet {
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
