/**
 * CSS 变量更新
 * @description 根据偏好设置更新 CSS 变量
 */

import type { Preferences, ThemeModeType, DOMSelectors } from '../types';
import { getThemePrimaryColor } from '../constants';
import { generateThemeColorVariables } from '../color';
import { updateCSSVariables, toggleClass, isBrowser, hasDocument } from '../utils';
import { CSS_VAR_LAYOUT } from '../constants/css-variables';
import { generateFontScaleVariables, clampFontScale } from '../helpers/font-scale';

/* ========== 默认选择器 ========== */

const DEFAULT_SELECTORS: Required<DOMSelectors> = {
  sidebar: '.admin-sidebar',
  header: '.admin-header',
};

/* ========== 缓存 ========== */

/** 缓存的 MediaQueryList 实例 */
let cachedDarkModeQuery: MediaQueryList | null = null;

/** 缓存的颜色变量（基于 primaryColor + isDark） */
let colorVariablesCache: {
  key: string;
  variables: Record<string, string>;
} | null = null;

/** 缓存的侧边栏和顶栏元素 */
let cachedSidebarElement: HTMLElement | null = null;
let cachedHeaderElement: HTMLElement | null = null;

/** 当前使用的选择器 */
let currentSelectors: Required<DOMSelectors> = { ...DEFAULT_SELECTORS };

/**
 * 设置 DOM 选择器配置
 * @param selectors - 选择器配置
 */
export function setDOMSelectors(selectors?: DOMSelectors): void {
  currentSelectors = {
    ...DEFAULT_SELECTORS,
    ...selectors,
  };
  // 清除缓存的元素引用，以便使用新选择器重新查找
  cachedSidebarElement = null;
  cachedHeaderElement = null;
}

/**
 * 获取缓存的 MediaQueryList
 */
function getDarkModeQuery(): MediaQueryList | null {
  if (!isBrowser || !window.matchMedia) return null;
  if (!cachedDarkModeQuery) {
    cachedDarkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  }
  return cachedDarkModeQuery;
}

/**
 * 获取当前实际主题模式
 * @param mode - 配置的模式
 * @returns 实际模式（light 或 dark）
 */
export function getActualThemeMode(mode: ThemeModeType): 'light' | 'dark' {
  if (mode === 'auto') {
    const query = getDarkModeQuery();
    return query?.matches ? 'dark' : 'light';
  }
  return mode;
}

/**
 * 更新主题 CSS 变量
 * @param preferences - 偏好设置
 */
export function updateThemeCSSVariables(preferences: Preferences): void {
  if (!hasDocument) return;

  const { theme } = preferences;
  const actualMode = getActualThemeMode(theme.mode);
  const isDark = actualMode === 'dark';

  // 切换 dark 类
  toggleClass('dark', isDark);

  // 获取主色
  let primaryColor: string;
  if (theme.builtinType === 'custom') {
    primaryColor = theme.colorPrimary;
  } else {
    primaryColor = getThemePrimaryColor(theme.builtinType, isDark);
  }

  // 根据当前主题模式获取背景跟随主题设置
  const colorFollowPrimary = isDark
    ? preferences.app.colorFollowPrimaryDark
    : preferences.app.colorFollowPrimaryLight;

  // 字体缩放（确保在有效范围内）
  const fontScale = clampFontScale(theme.fontScale);

  // 缓存键（基于主色 + 暗色模式 + 圆角 + 字体缩放 + 背景跟随主题）
  const cacheKey = `${primaryColor}-${isDark}-${theme.radius}-${fontScale}-${colorFollowPrimary}`;

  // 检查缓存
  let colorVariables: Record<string, string>;
  if (colorVariablesCache && colorVariablesCache.key === cacheKey) {
    colorVariables = colorVariablesCache.variables;
  } else {
    // 生成颜色变量
    colorVariables = generateThemeColorVariables({
      primaryColor,
      isDark,
      colorFollowPrimary,
    });

    // 添加圆角（使用 px 单位，避免受字体缩放影响）
    // 将 rem 值转换为 px（基于 16px 基准）
    const radiusValue = parseFloat(theme.radius);
    // 处理 NaN 情况，使用默认值 0.375rem (6px)
    const radiusPx = (Number.isNaN(radiusValue) ? 0.375 : radiusValue) * 16;
    colorVariables['--radius'] = `${radiusPx}px`;

    // 添加字体缩放变量
    const fontScaleVars = generateFontScaleVariables(fontScale);
    Object.assign(colorVariables, fontScaleVars);

    // 更新缓存
    colorVariablesCache = { key: cacheKey, variables: colorVariables };
  }

  // 更新 CSS 变量（内部会检查变化）
  updateCSSVariables(colorVariables);
}

/**
 * 更新布局 CSS 变量
 * @param preferences - 偏好设置
 */
export function updateLayoutCSSVariables(preferences: Preferences): void {
  if (!hasDocument) return;

  const { app, header, footer, sidebar, tabbar } = preferences;

  const layoutVariables: Record<string, string> = {
    [CSS_VAR_LAYOUT.HEADER_HEIGHT]: `${header.height}px`,
    [CSS_VAR_LAYOUT.FOOTER_HEIGHT]: `${footer.height}px`,
    [CSS_VAR_LAYOUT.SIDEBAR_WIDTH]: `${sidebar.width}px`,
    [CSS_VAR_LAYOUT.SIDEBAR_COLLAPSED_WIDTH]: `${sidebar.collapseWidth}px`,
    [CSS_VAR_LAYOUT.TABBAR_HEIGHT]: `${tabbar.height}px`,
    [CSS_VAR_LAYOUT.CONTENT_PADDING]: `${app.contentPadding}px`,
    [CSS_VAR_LAYOUT.CONTENT_PADDING_TOP]: `${app.contentPaddingTop}px`,
    [CSS_VAR_LAYOUT.CONTENT_PADDING_RIGHT]: `${app.contentPaddingRight}px`,
    [CSS_VAR_LAYOUT.CONTENT_PADDING_BOTTOM]: `${app.contentPaddingBottom}px`,
    [CSS_VAR_LAYOUT.CONTENT_PADDING_LEFT]: `${app.contentPaddingLeft}px`,
  };

  updateCSSVariables(layoutVariables);
}

/**
 * 检查元素是否仍在 DOM 中
 */
function isElementInDOM(element: HTMLElement | null): boolean {
  return element !== null && document.body.contains(element);
}

/**
 * 获取有效的缓存元素，如果缓存失效则重新查询
 */
function getValidElement(
  cachedElement: HTMLElement | null,
  selector: string
): HTMLElement | null {
  if (isElementInDOM(cachedElement)) {
    return cachedElement;
  }
  return document.querySelector(selector) as HTMLElement | null;
}

/**
 * 更新特殊模式 CSS 类
 * @param preferences - 偏好设置
 */
export function updateSpecialModeClasses(preferences: Preferences): void {
  if (!hasDocument) return;

  const { app, theme } = preferences;

  // 灰色模式
  toggleClass('grayscale-mode', app.colorGrayMode);

  // 色弱模式
  toggleClass('color-weak-mode', app.colorWeakMode);

  // 半深色侧边栏（使用缓存的元素引用，检查有效性）
  cachedSidebarElement = getValidElement(cachedSidebarElement, currentSelectors.sidebar);
  if (cachedSidebarElement) {
    toggleClass('semi-dark', theme.semiDarkSidebar && getActualThemeMode(theme.mode) === 'light', cachedSidebarElement);
  }

  // 半深色顶栏（使用缓存的元素引用，检查有效性）
  cachedHeaderElement = getValidElement(cachedHeaderElement, currentSelectors.header);
  if (cachedHeaderElement) {
    toggleClass('semi-dark', theme.semiDarkHeader && getActualThemeMode(theme.mode) === 'light', cachedHeaderElement);
  }
}

/**
 * 清除 CSS 更新器缓存
 * @description 在需要刷新缓存时调用（如 DOM 结构变化后）
 */
export function clearCSSUpdaterCache(): void {
  cachedDarkModeQuery = null;
  colorVariablesCache = null;
  cachedSidebarElement = null;
  cachedHeaderElement = null;
}

/**
 * 更新所有 CSS 变量
 * @param preferences - 偏好设置
 */
export function updateAllCSSVariables(preferences: Preferences): void {
  updateThemeCSSVariables(preferences);
  updateLayoutCSSVariables(preferences);
  updateSpecialModeClasses(preferences);
}
