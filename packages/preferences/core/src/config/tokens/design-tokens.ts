/**
 * 设计令牌 (Design Tokens)
 * @description 统一管理所有 UI 基础样式值
 *
 * 特点：
 * 1. 所有值都有默认值
 * 2. 用户可通过 configureDesignTokens() 覆盖默认值
 * 3. CSS 变量会自动同步更新
 *
 * @example
 * ```ts
 * import { configureDesignTokens, getDesignTokens } from '@admin-core/preferences';
 *
 * // 覆盖默认值
 * configureDesignTokens({
 *   drawer: { width: 450 },
 *   transition: { normal: 250 },
 * });
 *
 * // 获取当前值
 * const tokens = getDesignTokens();
 * console.log(tokens.drawer.width); // 450
 * ```
 */

import { safeMerge } from '../../utils/merge';
import type { DeepPartial } from '../../types';

/* ========== 类型定义 ========== */

/**
 * 抽屉尺寸配置
 */
export interface DrawerTokens {
  /** 抽屉宽度 (px) */
  width: number;
}

/**
 * 布局图标尺寸配置
 */
export interface LayoutIconTokens {
  /** 宽度 (px) */
  width: number;
  /** 高度 (px) */
  height: number;
}

/**
 * 图标尺寸配置
 */
export interface IconSizeTokens {
  /** 超小 (px) */
  xs: number;
  /** 小 (px) */
  sm: number;
  /** 中 (px) */
  md: number;
  /** 大 (px) */
  lg: number;
  /** 超大 (px) */
  xl: number;
}

/**
 * 字体大小配置
 */
export interface FontSizeTokens {
  /** 最小值 (px) */
  min: number;
  /** 最大值 (px) */
  max: number;
  /** 默认值 (px) */
  default: number;
  /** 步进值 (px) */
  step: number;
}

/**
 * 圆角配置
 */
export interface RadiusTokens {
  /** 可选值 (rem) */
  options: readonly string[];
  /** 默认值 (rem) */
  default: string;
  /** 默认像素值 (px) */
  defaultPx: number;
}

/**
 * 边框配置
 */
export interface BorderTokens {
  /** 默认宽度 (px) */
  width: number;
  /** 选中状态宽度 (px) */
  activeWidth: number;
}

/**
 * 过渡动画时长配置
 */
export interface TransitionTokens {
  /** 快速 (ms) */
  fast: number;
  /** 正常 (ms) */
  normal: number;
  /** 慢速 (ms) */
  slow: number;
}

/**
 * 颜色配置
 */
export interface ColorTokens {
  /** 主色调 (备用，实际使用 preferences.theme.colorPrimary) */
  primary: string;
  /** 预设回退色 */
  presetFallback: string;
  /** 白色 */
  white: string;
  /** 黑色 */
  black: string;
  /** 透明 */
  transparent: string;
}

/**
 * Z-Index 层级配置
 */
export interface ZIndexTokens {
  /** 下拉菜单 */
  dropdown: number;
  /** 模态框背景 */
  modalBackdrop: number;
  /** 模态框 */
  modal: number;
  /** 弹出层 */
  popover: number;
  /** 提示 */
  tooltip: number;
  /** 通知 */
  notification: number;
}

/**
 * 所有设计令牌类型
 */
export interface DesignTokens {
  drawer: DrawerTokens;
  layoutIcon: LayoutIconTokens;
  iconSizes: IconSizeTokens;
  fontSize: FontSizeTokens;
  radius: RadiusTokens;
  border: BorderTokens;
  transition: TransitionTokens;
  colors: ColorTokens;
  zIndex: ZIndexTokens;
}

/* ========== 默认值 ========== */

/**
 * 默认抽屉尺寸
 */
export const DRAWER_TOKEN_DEFAULTS: DrawerTokens = {
  width: 384,
};

/**
 * 默认布局图标尺寸
 */
export const LAYOUT_ICON_TOKEN_DEFAULTS: LayoutIconTokens = {
  width: 104,
  height: 66,
};

/**
 * 默认图标尺寸
 */
export const ICON_SIZE_TOKEN_DEFAULTS: IconSizeTokens = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
};

/**
 * 默认字体大小
 */
export const FONT_SIZE_TOKEN_DEFAULTS: FontSizeTokens = {
  min: 12,
  max: 20,
  default: 16,
  step: 1,
};

/**
 * 默认圆角
 */
export const RADIUS_TOKEN_DEFAULTS: RadiusTokens = {
  options: ['0', '0.25', '0.5', '0.75', '1'],
  default: '0.5',
  defaultPx: 6,
};

/**
 * 默认边框
 */
export const BORDER_TOKEN_DEFAULTS: BorderTokens = {
  width: 1,
  activeWidth: 2,
};

/**
 * 默认过渡动画时长
 */
export const TRANSITION_TOKEN_DEFAULTS: TransitionTokens = {
  fast: 150,
  normal: 200,
  slow: 300,
};

/**
 * 默认颜色
 */
export const COLOR_TOKEN_DEFAULTS: ColorTokens = {
  primary: '#0066ff',
  presetFallback: '#888888',
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

/**
 * 默认 Z-Index
 */
export const Z_INDEX_TOKEN_DEFAULTS: ZIndexTokens = {
  dropdown: 1000,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  notification: 1080,
};

/**
 * 所有默认设计令牌
 */
export const DEFAULT_DESIGN_TOKENS: DesignTokens = {
  drawer: DRAWER_TOKEN_DEFAULTS,
  layoutIcon: LAYOUT_ICON_TOKEN_DEFAULTS,
  iconSizes: ICON_SIZE_TOKEN_DEFAULTS,
  fontSize: FONT_SIZE_TOKEN_DEFAULTS,
  radius: RADIUS_TOKEN_DEFAULTS,
  border: BORDER_TOKEN_DEFAULTS,
  transition: TRANSITION_TOKEN_DEFAULTS,
  colors: COLOR_TOKEN_DEFAULTS,
  zIndex: Z_INDEX_TOKEN_DEFAULTS,
};

/* ========== 运行时状态 ========== */

/**
 * 当前设计令牌（可被用户配置覆盖）
 */
let currentTokens: DesignTokens = { ...DEFAULT_DESIGN_TOKENS };

/* ========== 公共 API ========== */

/**
 * 配置设计令牌（覆盖默认值）
 * @param overrides - 要覆盖的令牌
 *
 * @example
 * ```ts
 * configureDesignTokens({
 *   drawer: { width: 450 },
 *   transition: { normal: 250 },
 * });
 * ```
 */
export function configureDesignTokens(overrides: DeepPartial<DesignTokens>): void {
  currentTokens = safeMerge(DEFAULT_DESIGN_TOKENS, overrides);
}

/**
 * 获取当前设计令牌
 * @returns 当前设计令牌（包含用户覆盖）
 */
export function getDesignTokens(): Readonly<DesignTokens> {
  return currentTokens;
}

/**
 * 获取默认设计令牌
 * @returns 默认设计令牌（不受用户配置影响）
 */
export function getDefaultDesignTokens(): Readonly<DesignTokens> {
  return DEFAULT_DESIGN_TOKENS;
}

/**
 * 重置设计令牌为默认值
 */
export function resetDesignTokens(): void {
  currentTokens = { ...DEFAULT_DESIGN_TOKENS };
}

/* ========== 向后兼容的快捷访问 ========== */

/**
 * 获取抽屉配置
 */
export const drawer = new Proxy({} as DrawerTokens, {
  get: (_, prop) => currentTokens.drawer[prop as keyof DrawerTokens],
});

/**
 * 获取布局图标配置
 */
export const layoutIcon = new Proxy({} as LayoutIconTokens, {
  get: (_, prop) => currentTokens.layoutIcon[prop as keyof LayoutIconTokens],
});

/**
 * 获取图标尺寸配置
 */
export const iconSizes = new Proxy({} as IconSizeTokens, {
  get: (_, prop) => currentTokens.iconSizes[prop as keyof IconSizeTokens],
});

/**
 * 获取字体大小配置
 */
export const fontSize = new Proxy({} as FontSizeTokens, {
  get: (_, prop) => currentTokens.fontSize[prop as keyof FontSizeTokens],
});

/**
 * 获取圆角配置
 */
export const radius = new Proxy({} as RadiusTokens, {
  get: (_, prop) => currentTokens.radius[prop as keyof RadiusTokens],
});

/**
 * 获取边框配置
 */
export const border = new Proxy({} as BorderTokens, {
  get: (_, prop) => currentTokens.border[prop as keyof BorderTokens],
});

/**
 * 获取过渡动画配置
 */
export const transition = new Proxy({} as TransitionTokens, {
  get: (_, prop) => currentTokens.transition[prop as keyof TransitionTokens],
});

/**
 * 获取颜色配置
 */
export const colors = new Proxy({} as ColorTokens, {
  get: (_, prop) => currentTokens.colors[prop as keyof ColorTokens],
});

/**
 * 获取 Z-Index 配置
 */
export const zIndex = new Proxy({} as ZIndexTokens, {
  get: (_, prop) => currentTokens.zIndex[prop as keyof ZIndexTokens],
});

/**
 * 所有设计令牌的便捷访问
 */
export const designTokens = new Proxy({} as DesignTokens, {
  get: (_, prop) => currentTokens[prop as keyof DesignTokens],
});
