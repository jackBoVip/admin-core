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

/* ========== 组件交互常量 ========== */

/**
 * 滑块控件防抖延迟（毫秒）
 */
export const SLIDER_DEBOUNCE_MS = 150;

/**
 * 输入框防抖延迟（毫秒）
 */
export const INPUT_DEBOUNCE_MS = 300;

/**
 * 输入框默认最大长度
 */
export const INPUT_MAX_LENGTH = 200;

/**
 * 复制成功后自动重置延迟（毫秒）
 */
export const COPY_RESET_DELAY_MS = 2000;

/**
 * 清除密码按钮自动重置延迟（毫秒）
 */
export const CLEAR_PASSWORD_RESET_DELAY_MS = 2000;

/**
 * 焦点延迟（毫秒）- 用于模态框/抽屉打开后聚焦
 */
export const FOCUS_DELAY_MS = 100;

/**
 * 关闭动画延迟（毫秒）
 */
export const CLOSE_ANIMATION_DELAY_MS = 200;
