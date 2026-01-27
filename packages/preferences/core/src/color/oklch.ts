/**
 * OKLCH 颜色工具
 * @description OKLCH 是感知均匀的色彩空间，更适合生成协调的颜色
 *
 * OKLCH 格式: oklch(L C H)
 * - L (Lightness): 亮度 0-1 (0=黑, 1=白)
 * - C (Chroma): 色度/饱和度 0-0.4 (0=灰, 越大越饱和)
 * - H (Hue): 色相 0-360 (红≈25, 橙≈70, 黄≈100, 绿≈145, 青≈200, 蓝≈250, 紫≈300, 粉≈350)
 */

import { formatHex, parse, converter } from 'culori';

/**
 * 缓存的 OKLCH 转换器（避免每次调用重新创建）
 * @performance 转换器创建开销较大，缓存后可显著提升性能
 */
const oklchConverter = converter('oklch');

/**
 * OKLCH 颜色接口
 */
export interface OklchColor {
  /** 亮度 (0-1) */
  l: number;
  /** 色度/饱和度 (0-0.4) */
  c: number;
  /** 色相 (0-360) */
  h: number;
}

/**
 * 解析任意格式颜色为 OKLCH
 * @description 支持 hex, rgb, hsl, oklch 等格式
 * @param color - 颜色字符串
 * @returns OKLCH 颜色对象，解析失败返回 null
 */
export function parseToOklch(color: string): OklchColor | null {
  try {
    const parsed = parse(color);
    if (!parsed) return null;

    // 使用缓存的转换器
    const result = oklchConverter(parsed);

    return {
      l: result?.l ?? 0.5,
      c: result?.c ?? 0.15,
      h: result?.h ?? 250,
    };
  } catch {
    return null;
  }
}

/**
 * OKLCH 颜色对象转 CSS 字符串
 * @param color - OKLCH 颜色对象
 * @returns oklch(L C H) 格式字符串
 */
export function oklchToCss(color: OklchColor): string {
  return `oklch(${color.l.toFixed(3)} ${color.c.toFixed(3)} ${color.h.toFixed(1)})`;
}

/**
 * OKLCH 字符串转 Hex 格式
 * @param color - 颜色字符串
 * @returns Hex 格式颜色（如 #ffffff）
 */
export function oklchToHex(color: string): string {
  try {
    const parsed = parse(color);
    if (!parsed) return '#000000';
    return formatHex(parsed) ?? '#000000';
  } catch {
    return '#000000';
  }
}

/**
 * 验证颜色值是否有效
 * @param color - 颜色字符串
 * @returns 是否有效
 */
export function isValidColor(color: string): boolean {
  try {
    return parse(color) !== undefined;
  } catch {
    return false;
  }
}

/**
 * 创建 OKLCH 颜色
 * @param l - 亮度 (0-1)
 * @param c - 色度 (0-0.4)
 * @param h - 色相 (0-360)
 * @returns OKLCH CSS 字符串
 */
export function createOklch(l: number, c: number, h: number): string {
  // 确保值在有效范围内
  const clampedL = Math.max(0, Math.min(1, l));
  const clampedC = Math.max(0, Math.min(0.4, c));
  const clampedH = ((h % 360) + 360) % 360;

  return `oklch(${clampedL.toFixed(3)} ${clampedC.toFixed(3)} ${clampedH.toFixed(1)})`;
}

/**
 * 调整 OKLCH 颜色的亮度
 * @param color - 颜色字符串
 * @param amount - 调整量（正值变亮，负值变暗）
 * @returns 调整后的颜色
 */
export function adjustLightness(color: string, amount: number): string {
  const oklchColor = parseToOklch(color);
  if (!oklchColor) return color;

  const newL = Math.max(0, Math.min(1, oklchColor.l + amount));
  return createOklch(newL, oklchColor.c, oklchColor.h);
}

/**
 * 调整 OKLCH 颜色的色度（饱和度）
 * @param color - 颜色字符串
 * @param amount - 调整量
 * @returns 调整后的颜色
 */
export function adjustChroma(color: string, amount: number): string {
  const oklchColor = parseToOklch(color);
  if (!oklchColor) return color;

  const newC = Math.max(0, Math.min(0.4, oklchColor.c + amount));
  return createOklch(oklchColor.l, newC, oklchColor.h);
}

/**
 * 旋转 OKLCH 颜色的色相
 * @param color - 颜色字符串
 * @param degrees - 旋转角度
 * @returns 旋转后的颜色
 */
export function rotateHue(color: string, degrees: number): string {
  const oklchColor = parseToOklch(color);
  if (!oklchColor) return color;

  const newH = (oklchColor.h + degrees + 360) % 360;
  return createOklch(oklchColor.l, oklchColor.c, newH);
}
