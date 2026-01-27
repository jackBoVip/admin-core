/**
 * 生成 CSS 变量
 * @description 从设计令牌生成 CSS 变量字符串
 */

import { getDesignTokens } from './design-tokens';

/**
 * 生成 CSS 变量声明
 * @param tokens - 可选的令牌覆盖，默认使用当前配置的令牌
 */
export function generateCSSVariables(): string {
  const tokens = getDesignTokens();
  const lines: string[] = [
    '/**',
    ' * 设计令牌 CSS 变量',
    ' * @description 由 design-tokens.ts 自动生成，请勿手动修改',
    ' */',
    '',
    ':root {',
  ];

  // 抽屉
  lines.push('  /* 抽屉 */');
  lines.push(`  --admin-drawer-width: ${tokens.drawer.width}px;`);
  lines.push('');

  // 布局图标
  lines.push('  /* 布局图标 */');
  lines.push(`  --admin-layout-icon-width: ${tokens.layoutIcon.width}px;`);
  lines.push(`  --admin-layout-icon-height: ${tokens.layoutIcon.height}px;`);
  lines.push('');

  // 图标尺寸
  lines.push('  /* 图标尺寸 */');
  for (const [key, value] of Object.entries(tokens.iconSizes)) {
    lines.push(`  --admin-icon-size-${key}: ${value}px;`);
  }
  lines.push('');

  // 字体大小
  lines.push('  /* 字体大小 */');
  lines.push(`  --admin-font-size-min: ${tokens.fontSize.min}px;`);
  lines.push(`  --admin-font-size-max: ${tokens.fontSize.max}px;`);
  lines.push(`  --admin-font-size-default: ${tokens.fontSize.default}px;`);
  lines.push('');

  // 圆角
  lines.push('  /* 圆角 */');
  lines.push(`  --admin-radius-default: ${tokens.radius.defaultPx}px;`);
  lines.push('');

  // 边框
  lines.push('  /* 边框 */');
  lines.push(`  --admin-border-width: ${tokens.border.width}px;`);
  lines.push(`  --admin-border-width-active: ${tokens.border.activeWidth}px;`);
  lines.push('');

  // 过渡动画
  lines.push('  /* 过渡动画 */');
  for (const [key, value] of Object.entries(tokens.transition)) {
    lines.push(`  --admin-transition-${key}: ${value}ms;`);
  }
  lines.push('');

  // 颜色
  lines.push('  /* 颜色 */');
  lines.push(`  --admin-color-primary: ${tokens.colors.primary};`);
  lines.push(`  --admin-color-preset-fallback: ${tokens.colors.presetFallback};`);
  lines.push('');

  // Z-Index
  lines.push('  /* Z-Index */');
  for (const [key, value] of Object.entries(tokens.zIndex)) {
    const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    lines.push(`  --admin-z-index-${kebabKey}: ${value};`);
  }

  lines.push('}');

  return lines.join('\n');
}

/**
 * 获取设计令牌的 CSS 变量名映射
 */
export const cssVarNames = {
  drawer: {
    width: '--admin-drawer-width',
  },
  layoutIcon: {
    width: '--admin-layout-icon-width',
    height: '--admin-layout-icon-height',
  },
  iconSizes: {
    xs: '--admin-icon-size-xs',
    sm: '--admin-icon-size-sm',
    md: '--admin-icon-size-md',
    lg: '--admin-icon-size-lg',
    xl: '--admin-icon-size-xl',
  },
  fontSize: {
    min: '--admin-font-size-min',
    max: '--admin-font-size-max',
    default: '--admin-font-size-default',
  },
  radius: {
    default: '--admin-radius-default',
  },
  border: {
    width: '--admin-border-width',
    activeWidth: '--admin-border-width-active',
  },
  transition: {
    fast: '--admin-transition-fast',
    normal: '--admin-transition-normal',
    slow: '--admin-transition-slow',
  },
  colors: {
    primary: '--admin-color-primary',
    presetFallback: '--admin-color-preset-fallback',
  },
  zIndex: {
    dropdown: '--admin-z-index-dropdown',
    modalBackdrop: '--admin-z-index-modal-backdrop',
    modal: '--admin-z-index-modal',
    popover: '--admin-z-index-popover',
    tooltip: '--admin-z-index-tooltip',
    notification: '--admin-z-index-notification',
  },
} as const;

export default generateCSSVariables;
