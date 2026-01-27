/**
 * UI 业务常量
 * @description 仅保留业务相关常量，设计令牌直接从 config/tokens 模块导入
 *
 * 使用指南：
 * - 业务选项（如圆角选项数组）从此文件导入
 * - 设计数值（如尺寸、颜色）直接从 config/tokens 导入
 *
 * @example
 * ```ts
 * // 业务选项
 * import { RADIUS_OPTIONS } from '@admin-core/preferences';
 *
 * // 设计令牌（推荐直接使用）
 * import { drawerTokens, iconSizesTokens } from '@admin-core/preferences';
 * const width = drawerTokens.width; // 384
 * ```
 */

import {
  radius as tokenRadius,
  fontSize as tokenFontSize,
} from '../config/tokens';

/* ========== 圆角选项（用于 UI 选择器） ========== */

/**
 * 圆角选项值（用于选择器）
 */
export const RADIUS_OPTIONS = tokenRadius.options;

/**
 * 圆角选项类型
 */
export type RadiusOption = (typeof RADIUS_OPTIONS)[number];

/**
 * 默认圆角值
 */
export const DEFAULT_RADIUS: RadiusOption = tokenRadius.default as RadiusOption;

/* ========== 字体大小范围（用于滑块控件） ========== */

/**
 * 字体大小最小值
 */
export const FONT_SIZE_MIN = tokenFontSize.min;

/**
 * 字体大小最大值
 */
export const FONT_SIZE_MAX = tokenFontSize.max;

/**
 * 字体大小默认值
 */
export const FONT_SIZE_DEFAULT = tokenFontSize.default;

/**
 * 字体大小步进值
 */
export const FONT_SIZE_STEP = tokenFontSize.step;
