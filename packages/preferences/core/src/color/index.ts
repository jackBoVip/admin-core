/**
 * 颜色系统模块。
 * @description
 * 设计原则：
 * 1. 只配置主色，其他语义色通过 OKLCH 色相旋转派生
 * 2. 支持 50-950 色阶生成
 * 3. 支持多 UI 组件库适配
 * 4. 基于 WCAG 标准的对比度计算
 */

/**
 * OKLCH 工具导出。
 * @description 提供颜色解析、构造与色相/亮度/色度变换能力。
 */
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

/**
 * 色阶生成导出。
 * @description 提供主色到多档色阶的计算与变量映射能力。
 */
export {
  COLOR_SHADES,
  generateColorScale,
  generateColorScaleVariables,
  type ColorShade,
} from './scales';

/**
 * 语义色派生导出。
 * @description 提供成功/警告/错误等语义色的派生规则与缓存管理。
 */
export {
  clearSemanticColorCache,
  deriveSemanticColors,
  getSemanticColor,
  SEMANTIC_HUE_OFFSETS,
  type SemanticColorName,
  type SemanticColors,
} from './semantic';

/**
 * 对比度计算导出。
 * @description 提供可访问性对比度计算与前景色选择能力。
 */
export {
  generateContrastColors,
  getAccessibleForeground,
  getContrastColor,
  getContrastRatio,
  getRelativeLuminance,
  meetsWCAG,
  type WCAGLevel,
} from './contrast';

/**
 * 颜色变量生成导出。
 * @description 提供主题 CSS 变量与中性色体系的批量生成能力。
 */
export {
  generateColorVariables,
  generateDarkNeutralColors,
  generateLightNeutralColors,
  generateThemeColorVariables,
  type ThemeColorOptions,
} from './variables';
