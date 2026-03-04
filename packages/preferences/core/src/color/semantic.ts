/**
 * 语义色派生
 * @description 从主色通过 OKLCH 色相旋转派生语义色
 */

import { createOklch, parseToOklch } from './oklch';

/**
 * 语义色名称
 */
export type SemanticColorName = 'destructive' | 'info' | 'primary' | 'success' | 'warning';

/**
 * 语义色配置
 */
export interface SemanticColors {
  /** 主色 */
  primary: string;
  /** 成功色（绿色方向） */
  success: string;
  /** 警告色（黄色方向） */
  warning: string;
  /** 危险色（红色方向） */
  destructive: string;
  /** 信息色（青色方向） */
  info: string;
}

/**
 * 语义色的色相偏移量（相对于主色）
 * @description
 * - primary: 0° 无偏移
 * - success: +145° 绿色方向
 * - warning: +85° 黄色/橙色方向
 * - destructive: +30° 红色方向
 * - info: -30° 青色方向
 */
export const SEMANTIC_HUE_OFFSETS: Record<SemanticColorName, number> = {
  primary: 0,
  success: 145,
  warning: 85,
  destructive: 30,
  info: -30,
};

/**
 * 语义色的亮度调整
 */
const SEMANTIC_LIGHTNESS_ADJUST: Record<SemanticColorName, number> = {
  primary: 0,
  success: 0.05, // 绿色稍亮一点更清新
  warning: 0.15, // 警告色需要更亮以保持可见性
  destructive: 0,
  info: 0,
};

/**
 * 语义色的饱和度调整
 */
const SEMANTIC_CHROMA_ADJUST: Record<SemanticColorName, number> = {
  primary: 0,
  success: -0.02,
  warning: -0.04, // 黄色饱和度稍低避免刺眼
  destructive: 0.02, // 危险色稍饱和更醒目
  info: -0.02,
};

/**
 * 从主色派生语义色
 * @description 使用 OKLCH 色相旋转，保持亮度和饱和度协调
 * @param primaryColor - 主色（任意格式）
 * @returns 语义色对象
 */
export function deriveSemanticColors(primaryColor: string): SemanticColors {
  const primary = parseToOklch(primaryColor);

  /**
   * 默认语义色兜底。
   * @description 当主色解析失败时返回一组固定可用的默认语义色。
   */
  if (!primary) {
    return {
      primary: 'oklch(0.55 0.2 250)',
      success: 'oklch(0.6 0.18 145)',
      warning: 'oklch(0.7 0.16 85)',
      destructive: 'oklch(0.55 0.22 25)',
      info: 'oklch(0.55 0.18 220)',
    };
  }

  /**
   * 按语义名称基于主色派生目标颜色。
   * @param name 语义色名称。
   * @returns 语义色字符串（OKLCH）。
   */
  const createSemanticColor = (name: SemanticColorName): string => {
    const hueOffset = SEMANTIC_HUE_OFFSETS[name];
    const lightnessAdjust = SEMANTIC_LIGHTNESS_ADJUST[name];
    const chromaAdjust = SEMANTIC_CHROMA_ADJUST[name];

    const h = (primary.h + hueOffset + 360) % 360;
    const l = Math.max(0, Math.min(1, primary.l + lightnessAdjust));
    const c = Math.max(0, Math.min(0.4, primary.c + chromaAdjust));

    return createOklch(l, c, h);
  };

  return {
    primary: createSemanticColor('primary'),
    success: createSemanticColor('success'),
    warning: createSemanticColor('warning'),
    destructive: createSemanticColor('destructive'),
    info: createSemanticColor('info'),
  };
}

/**
 * 语义色缓存（避免重复计算）
 * @performance 缓存最近使用的主色及其派生色
 */
let semanticColorCache: {
  /** 最近一次计算的主色。 */
  primaryColor: string;
  /** 主色对应的语义色结果。 */
  colors: SemanticColors;
} | null = null;

/**
 * 获取单个语义色（优化版）
 * @description 使用缓存避免重复派生，或直接计算单个颜色
 * @param primaryColor - 主色
 * @param name - 语义色名称
 * @returns 语义色
 */
export function getSemanticColor(primaryColor: string, name: SemanticColorName): string {
  /**
   * 缓存命中快速返回。
   */
  if (semanticColorCache?.primaryColor === primaryColor) {
    return semanticColorCache.colors[name];
  }

  /**
   * 主色直返分支。
   * @description 仅请求 `primary` 时无需派生全量语义色。
   */
  if (name === 'primary') {
    const primary = parseToOklch(primaryColor);
    if (!primary) return 'oklch(0.55 0.2 250)';
    return createOklch(primary.l, primary.c, primary.h);
  }

  /**
   * 全量派生并写入缓存。
   */
  const colors = deriveSemanticColors(primaryColor);
  semanticColorCache = { primaryColor, colors };
  return colors[name];
}

/**
 * 清除语义色缓存
 * @description 当主色变化时调用
 */
export function clearSemanticColorCache(): void {
  semanticColorCache = null;
}
