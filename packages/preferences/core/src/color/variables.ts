/**
 * 颜色变量生成
 * @description 从主色生成完整的 CSS 变量
 */

import { getContrastColor } from './contrast';
import { parseToOklch, createOklch } from './oklch';
import { generateColorScaleVariables } from './scales';
import { deriveSemanticColors, type SemanticColors } from './semantic';

/**
 * 生成完整的颜色 CSS 变量
 * @description 从主色生成所有语义色及其色阶
 * @param primaryColor - 主色
 * @returns CSS 变量对象
 */
export function generateColorVariables(primaryColor: string): Record<string, string> {
  const semanticColors = deriveSemanticColors(primaryColor);
  const variables: Record<string, string> = {};

  // 定义语义色名称映射
  const colorNames: Array<{ key: keyof SemanticColors; cssName: string }> = [
    { key: 'primary', cssName: 'primary' },
    { key: 'success', cssName: 'success' },
    { key: 'warning', cssName: 'warning' },
    { key: 'destructive', cssName: 'destructive' },
    { key: 'info', cssName: 'info' },
  ];

  // 为每个语义色生成色阶
  colorNames.forEach(({ key, cssName }) => {
    const color = semanticColors[key];

    // 生成色阶变量
    const scaleVars = generateColorScaleVariables(color, cssName);
    Object.assign(variables, scaleVars);

    // 生成前景色（文字颜色）
    variables[`--${cssName}-foreground`] = getContrastColor(color);
  });

  return variables;
}

/**
 * 生成暗色模式的中性色变量
 * @param primaryColor - 可选，主色（用于背景跟随主题）
 * @returns 暗色模式中性色变量
 */
export function generateDarkNeutralColors(primaryColor?: string): Record<string, string> {
  // 默认色相（蓝灰色）
  let hue = 250;
  let chroma = 0.02;

  // 如果提供了主色，使用主色的色相
  if (primaryColor) {
    const parsed = parseToOklch(primaryColor);
    if (parsed) {
      hue = parsed.h;
      chroma = Math.min(parsed.c * 0.15, 0.04); // 使用较低的饱和度
    }
  }

  return {
    '--background': createOklch(0.13, chroma, hue),
    '--foreground': 'oklch(0.98 0 0)',
    '--muted': createOklch(0.2, chroma, hue),
    '--muted-foreground': createOklch(0.65, chroma, hue),
    '--accent': createOklch(0.2, chroma, hue),
    '--accent-foreground': 'oklch(0.98 0 0)',
    '--border': createOklch(0.25, chroma, hue),
    '--input': createOklch(0.25, chroma, hue),
    '--card': createOklch(0.16, chroma, hue),
    '--card-foreground': 'oklch(0.98 0 0)',
    // 侧边栏颜色（深色模式）- 跟随主题色
    '--sidebar-dark': createOklch(0.12, chroma, hue),
    '--sidebar-dark-foreground': 'oklch(0.98 0 0)',
    '--sidebar-dark-muted': createOklch(0.7, chroma, hue),
    '--sidebar-dark-border': createOklch(0.2, chroma, hue),
    '--sidebar-dark-hover': createOklch(0.18, chroma, hue),
    // 侧边栏子菜单区域背景
    '--sidebar-extra': createOklch(0.15, chroma, hue),
  };
}

/**
 * 生成亮色模式的中性色变量
 * @param primaryColor - 可选，主色（用于背景跟随主题）
 * @returns 亮色模式中性色变量
 */
export function generateLightNeutralColors(primaryColor?: string): Record<string, string> {
  // 默认色相（蓝灰色）
  let hue = 250;
  let chroma = 0.01;

  // 如果提供了主色，使用主色的色相
  if (primaryColor) {
    const parsed = parseToOklch(primaryColor);
    if (parsed) {
      hue = parsed.h;
      chroma = Math.min(parsed.c * 0.1, 0.03); // 使用较低的饱和度
    }
  }

  return {
    '--background': primaryColor ? createOklch(0.98, chroma * 0.5, hue) : 'oklch(1 0 0)',
    '--foreground': createOklch(0.1, chroma * 2, hue),
    '--muted': createOklch(0.96, chroma, hue),
    '--muted-foreground': createOklch(0.45, chroma * 2, hue),
    '--accent': createOklch(0.96, chroma, hue),
    '--accent-foreground': createOklch(0.15, chroma * 2, hue),
    '--border': createOklch(0.9, chroma, hue),
    '--input': createOklch(0.9, chroma, hue),
    '--card': primaryColor ? createOklch(0.99, chroma * 0.3, hue) : 'oklch(1 0 0)',
    '--card-foreground': createOklch(0.1, chroma * 2, hue),
  };
}

/**
 * 主题颜色变量生成选项
 */
export interface ThemeColorOptions {
  /** 主色 */
  primaryColor: string;
  /** 是否暗色模式 */
  isDark: boolean;
  /** 背景跟随主题色（同时用于 light/dark 时兼容旧用法） */
  colorFollowPrimary?: boolean;
  /** 浅色模式下降栏/顶栏背景是否跟随主题色 */
  colorFollowPrimaryLight?: boolean;
  /** 深色模式下降栏/顶栏背景是否跟随主题色 */
  colorFollowPrimaryDark?: boolean;
}

/**
 * 生成完整的主题颜色变量
 * @param options - 选项
 * @returns 完整的 CSS 变量
 */
export function generateThemeColorVariables(
  options: ThemeColorOptions | string,
  isDark?: boolean
): Record<string, string> {
  // 兼容旧的调用方式
  let primaryColor: string;
  let dark: boolean;
  let colorFollowPrimary = false;
  let colorFollowPrimaryLight = false;
  let colorFollowPrimaryDark = false;

  if (typeof options === 'string') {
    primaryColor = options;
    dark = isDark ?? false;
  } else {
    primaryColor = options.primaryColor;
    dark = options.isDark;
    colorFollowPrimary = options.colorFollowPrimary ?? false;
    colorFollowPrimaryLight = options.colorFollowPrimaryLight ?? colorFollowPrimary;
    colorFollowPrimaryDark = options.colorFollowPrimaryDark ?? colorFollowPrimary;
  }

  // 语义色变量
  const colorVars = generateColorVariables(primaryColor);

  // 中性色变量（如果开启背景跟随主题，传入主色）
  const neutralVars = dark
    ? generateDarkNeutralColors(colorFollowPrimary ? primaryColor : undefined)
    : generateLightNeutralColors(colorFollowPrimary ? primaryColor : undefined);

  // 顶栏颜色变量：同时生成 light/dark 两套，使顶栏在主题切换时能正确切换背景
  const headerVars = generateHeaderVariablesBoth(primaryColor, colorFollowPrimaryLight, colorFollowPrimaryDark);

  // 其他变量
  const otherVars: Record<string, string> = {
    '--ring': colorVars['--primary'] || primaryColor,
  };

  return {
    ...colorVars,
    ...neutralVars,
    ...headerVars,
    ...otherVars,
  };
}

/**
 * 生成单侧顶栏颜色变量（仅 light 或仅 dark）
 */
function generateHeaderVariablesOne(
  primaryColor: string,
  isDark: boolean,
  colorFollowPrimary: boolean
): Record<string, string> {
  let hue = 250;
  let chroma = 0.01;

  if (primaryColor) {
    const parsed = parseToOklch(primaryColor);
    if (parsed) {
      hue = parsed.h;
      chroma = Math.min(parsed.c * 0.1, 0.03);
    }
  }

  if (isDark) {
    if (colorFollowPrimary) {
      return {
        '--header-bg-dark': createOklch(0.15, chroma * 1.5, hue),
        '--header-fg-dark': createOklch(0.95, 0.01, hue),
        '--header-border-dark': createOklch(0.25, chroma * 1.2, hue),
      };
    }
    return {
      '--header-bg-dark': 'oklch(0.12 0.02 250)',
      '--header-fg-dark': 'oklch(0.98 0 0)',
      '--header-border-dark': 'oklch(0.2 0.02 250)',
    };
  }

  if (colorFollowPrimary) {
    return {
      '--header-bg-light': createOklch(0.95, chroma * 0.8, hue),
      '--header-fg-light': createOklch(0.15, chroma * 2, hue),
    };
  }
  return {
    '--header-bg-light': 'oklch(1 0 0)',
    '--header-fg-light': 'oklch(0.15 0.02 250)',
  };
}

/**
 * 同时生成顶栏浅色与深色两套 CSS 变量
 * @description 确保主题切换时顶栏背景能正确随 light/dark 切换，避免只更新一侧导致顶栏不随主题变化
 * @param primaryColor - 主色
 * @param colorFollowPrimaryLight - 浅色模式下顶栏背景是否跟随主题色
 * @param colorFollowPrimaryDark - 深色模式下顶栏背景是否跟随主题色
 * @returns 顶栏 CSS 变量（含 --header-bg-light / --header-fg-light 与 --header-bg-dark / --header-fg-dark / --header-border-dark）
 */
function generateHeaderVariablesBoth(
  primaryColor: string,
  colorFollowPrimaryLight: boolean,
  colorFollowPrimaryDark: boolean
): Record<string, string> {
  const lightVars = generateHeaderVariablesOne(primaryColor, false, colorFollowPrimaryLight);
  const darkVars = generateHeaderVariablesOne(primaryColor, true, colorFollowPrimaryDark);
  return { ...lightVars, ...darkVars };
}
