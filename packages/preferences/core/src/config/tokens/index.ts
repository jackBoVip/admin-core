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

// 类型
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

// 默认值（只读）
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

// 配置 API
export {
  configureDesignTokens,
  getDesignTokens,
  getDefaultDesignTokens,
  resetDesignTokens,
} from './design-tokens';

// 快捷访问（响应用户配置）
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

// CSS 生成
export { generateCSSVariables, cssVarNames } from './generate-css';
