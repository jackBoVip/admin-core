/**
 * 颜色系统模块
 * @description
 * 设计原则：
 * 1. 只配置主色，其他语义色通过 OKLCH 色相旋转派生
 * 2. 支持 50-950 色阶生成
 * 3. 支持多 UI 组件库适配
 * 4. 基于 WCAG 标准的对比度计算
 */

// OKLCH 工具
export {
  adjustChroma,
  adjustLightness,
  createOklch,
  isValidColor,
  oklchToCss,
  oklchToHex,
  parseToOklch,
  rotateHue,
  type OklchColor,
} from './oklch';

// 色阶生成
export {
  COLOR_SHADES,
  generateColorScale,
  generateColorScaleVariables,
  type ColorShade,
} from './scales';

// 语义色派生
export {
  clearSemanticColorCache,
  deriveSemanticColors,
  getSemanticColor,
  SEMANTIC_HUE_OFFSETS,
  type SemanticColorName,
  type SemanticColors,
} from './semantic';

// 对比度计算
export {
  generateContrastColors,
  getAccessibleForeground,
  getContrastColor,
  getContrastRatio,
  getRelativeLuminance,
  meetsWCAG,
  type WCAGLevel,
} from './contrast';

// 颜色变量生成
export {
  generateColorVariables,
  generateDarkNeutralColors,
  generateLightNeutralColors,
  generateThemeColorVariables,
  type ThemeColorOptions,
} from './variables';
