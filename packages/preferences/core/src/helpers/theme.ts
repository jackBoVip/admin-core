import { isBrowser } from '../utils';
import type { ThemeModeType } from '../types';

export interface ThemeRuntimeConfig {
  mode?: ThemeModeType;
  colorPrimary?: string;
  fontScale?: number;
  radius?: string;
  colorGrayMode?: boolean;
  colorWeakMode?: boolean;
}

let cachedDarkModeQuery: MediaQueryList | null = null;

function getDarkModeQuery(): MediaQueryList | null {
  if (!isBrowser || !window.matchMedia) return null;
  if (!cachedDarkModeQuery) {
    cachedDarkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  }
  return cachedDarkModeQuery;
}

export function getActualThemeMode(mode: ThemeModeType): 'light' | 'dark' {
  if (mode === 'auto') {
    const query = getDarkModeQuery();
    return query?.matches ? 'dark' : 'light';
  }
  return mode;
}

export function clearThemeModeCache(): void {
  cachedDarkModeQuery = null;
}

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
