import { isBrowser } from '../utils';
import type { ThemeModeType } from '../types';

/**
 * 主题运行时配置。
 */
export interface ThemeRuntimeConfig {
  /** 主题模式。 */
  mode?: ThemeModeType;
  /** 主色。 */
  colorPrimary?: string;
  /** 字体缩放比例。 */
  fontScale?: number;
  /** 圆角值（rem）。 */
  radius?: string;
  /** 是否灰度模式。 */
  colorGrayMode?: boolean;
  /** 是否色弱模式。 */
  colorWeakMode?: boolean;
}

let cachedDarkModeQuery: MediaQueryList | null = null;

/**
 * 获取系统深色模式媒体查询对象（带缓存）。
 * @returns 媒体查询对象；浏览器不可用时返回 `null`。
 */
function getDarkModeQuery(): MediaQueryList | null {
  if (!isBrowser || !window.matchMedia) return null;
  if (!cachedDarkModeQuery) {
    cachedDarkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  }
  return cachedDarkModeQuery;
}

/**
 * 解析实际主题模式。
 * @param mode 主题模式配置。
 * @returns 实际模式（`light` 或 `dark`）。
 */
export function getActualThemeMode(mode: ThemeModeType): 'light' | 'dark' {
  if (mode === 'auto') {
    const query = getDarkModeQuery();
    return query?.matches ? 'dark' : 'light';
  }
  return mode;
}

/**
 * 清理深色模式媒体查询缓存。
 * @returns 无返回值
 */
export function clearThemeModeCache(): void {
  cachedDarkModeQuery = null;
}

/**
 * 根据主题配置生成 CSS 变量集合。
 * @param theme 主题运行时配置。
 * @returns CSS 变量映射。
 */
export function generateThemeCSSVariables(theme: ThemeRuntimeConfig = {}): Record<string, string> {
  const vars: Record<string, string> = {};
  const actualMode = theme.mode ? getActualThemeMode(theme.mode) : 'light';

  vars['--theme-mode'] = actualMode;

  if (theme.colorPrimary) {
    vars['--color-primary'] = theme.colorPrimary;
  }

  if (theme.fontScale) {
    vars['--font-scale'] = theme.fontScale.toString();
    vars['--font-size-base'] = `${16 * theme.fontScale}px`;
  }

  if (theme.radius) {
    vars['--radius'] = `${theme.radius}rem`;
  }

  return vars;
}

/**
 * 根据主题配置生成根节点类名集合。
 * @param theme 主题运行时配置。
 * @returns 主题类名数组。
 */
export function generateThemeClasses(theme: ThemeRuntimeConfig = {}): string[] {
  const classes: string[] = [];
  const actualMode = theme.mode ? getActualThemeMode(theme.mode) : 'light';

  if (actualMode === 'dark') {
    classes.push('dark');
  }

  if (theme.colorGrayMode) {
    classes.push('grayscale-mode');
  }

  if (theme.colorWeakMode) {
    classes.push('color-weak-mode');
  }

  return classes;
}
