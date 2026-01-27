/**
 * 颜色阶梯生成
 * @description 从基础颜色生成 50-950 的色阶
 */

import { createOklch, parseToOklch } from './oklch';

/**
 * 色阶级别
 */
export const COLOR_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

/**
 * 色阶类型
 */
export type ColorShade = (typeof COLOR_SHADES)[number];

/**
 * 色阶亮度映射
 * @description 50 最亮，950 最暗
 */
const LIGHTNESS_MAP: Record<ColorShade, number> = {
  50: 0.97,
  100: 0.93,
  200: 0.87,
  300: 0.77,
  400: 0.67,
  500: 0.55,
  600: 0.47,
  700: 0.39,
  800: 0.31,
  900: 0.23,
  950: 0.15,
};

/**
 * 色阶饱和度映射
 * @description 中间色阶（400-600）最饱和，两端较灰
 */
const CHROMA_MULTIPLIER: Record<ColorShade, number> = {
  50: 0.1,
  100: 0.25,
  200: 0.5,
  300: 0.75,
  400: 0.9,
  500: 1.0,
  600: 0.9,
  700: 0.8,
  800: 0.65,
  900: 0.5,
  950: 0.4,
};

/**
 * 生成颜色色阶
 * @description 在 OKLCH 空间中生成 50-950 的色阶
 * @param baseColor - 基础颜色（任意格式）
 * @returns 色阶对象 { 50: 'oklch(...)', 100: 'oklch(...)', ... }
 */
export function generateColorScale(baseColor: string): Record<ColorShade, string> {
  const base = parseToOklch(baseColor);

  // 如果解析失败，使用默认蓝色
  const defaultBase = { l: 0.55, c: 0.2, h: 250 };
  const color = base ?? defaultBase;

  const scale = {} as Record<ColorShade, string>;

  COLOR_SHADES.forEach((shade) => {
    const l = LIGHTNESS_MAP[shade];
    // 保持原色相，根据色阶调整饱和度
    const c = Math.min(color.c * CHROMA_MULTIPLIER[shade], 0.4);
    scale[shade] = createOklch(l, c, color.h);
  });

  return scale;
}

/**
 * 生成颜色色阶 CSS 变量
 * @param baseColor - 基础颜色
 * @param prefix - CSS 变量前缀（如 'primary'）
 * @returns CSS 变量对象 { '--primary-50': 'oklch(...)', ... }
 */
export function generateColorScaleVariables(
  baseColor: string,
  prefix: string
): Record<string, string> {
  const scale = generateColorScale(baseColor);
  const variables: Record<string, string> = {};

  // 设置基础色（500 为基准）
  variables[`--${prefix}`] = scale[500];

  // 设置所有色阶
  COLOR_SHADES.forEach((shade) => {
    variables[`--${prefix}-${shade}`] = scale[shade];
  });

  return variables;
}
