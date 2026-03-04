/**
 * 设计令牌模块
 * @description 统一管理所有 UI 基础样式值
 *
 * 使用方式：
 * ```ts
 * import {
 *   configureDesignTokens,
 *   getDesignTokens,
 *   DEFAULT_DESIGN_TOKENS,
 * } from '@admin-core/preferences';
 *
 * // 1. 使用默认值
 * const tokens = getDesignTokens();
 *
 * // 2. 覆盖默认值
 * configureDesignTokens({
 *   drawer: { width: 450 },
 * });
 * ```
 */

/** 设计令牌类型定义。 */
export type {
  DesignTokens,
  DrawerTokens,
  LayoutIconTokens,
  IconSizeTokens,
  FontSizeTokens,
  RadiusTokens,
  BorderTokens,
  TransitionTokens,
  ColorTokens,
  ZIndexTokens,
} from './design-tokens';

/** 设计令牌默认值（只读）。 */
export {
  DEFAULT_DESIGN_TOKENS,
  DRAWER_TOKEN_DEFAULTS,
  LAYOUT_ICON_TOKEN_DEFAULTS,
  ICON_SIZE_TOKEN_DEFAULTS,
  FONT_SIZE_TOKEN_DEFAULTS,
  RADIUS_TOKEN_DEFAULTS,
  BORDER_TOKEN_DEFAULTS,
  TRANSITION_TOKEN_DEFAULTS,
  COLOR_TOKEN_DEFAULTS,
  Z_INDEX_TOKEN_DEFAULTS,
} from './design-tokens';

/** 设计令牌配置 API。 */
export {
  configureDesignTokens,
  getDesignTokens,
  getDefaultDesignTokens,
  resetDesignTokens,
} from './design-tokens';

/** 设计令牌快捷访问对象（响应配置变化）。 */
export {
  designTokens,
  drawer,
  layoutIcon,
  iconSizes,
  fontSize,
  radius,
  border,
  transition,
  colors,
  zIndex,
} from './design-tokens';

/** 样式变量生成工具函数。 */
export { generateCSSVariables, cssVarNames } from './generate-css';
