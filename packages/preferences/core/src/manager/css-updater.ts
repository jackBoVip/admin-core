/**
 * CSS 变量更新。
 * @description 根据偏好设置同步主题、布局与特殊模式相关 CSS 变量与类名。
 */

import { generateThemeColorVariables } from '../color';
import { getThemePrimaryColor } from '../constants';
import { CSS_VAR_LAYOUT } from '../constants/css-variables';
import { generateFontScaleVariables, clampFontScale } from '../helpers/font-scale';
import { getActualThemeMode, clearThemeModeCache } from '../helpers/theme';
import { updateCSSVariables, toggleClass, hasDocument } from '../utils';
import type { Preferences, DOMSelectors } from '../types';

/* ========== 默认选择器 ========== */

const DEFAULT_SELECTORS: Required<DOMSelectors> = {
  sidebar: '.admin-sidebar',
  header: '.admin-header',
};

/* ========== 缓存 ========== */

/** 缓存的颜色变量（基于 primaryColor + isDark） */
let colorVariablesCache: {
  /** 键名。 */
  key: string;
  /** 已计算的颜色变量映射。 */
  variables: Record<string, string>;
} | null = null;

/** 缓存的侧边栏和顶栏元素 */
let cachedSidebarElement: HTMLElement | null = null;
let cachedHeaderElement: HTMLElement | null = null;

/** 当前使用的选择器 */
let currentSelectors: Required<DOMSelectors> = { ...DEFAULT_SELECTORS };

/**
 * 设置 DOM 选择器配置。
 * @param selectors 选择器配置。
 * @returns 无返回值。
 */
export function setDOMSelectors(selectors?: DOMSelectors): void {
  currentSelectors = {
    ...DEFAULT_SELECTORS,
    ...selectors,
  };
  /**
   * 清空缓存元素引用。
   * @description 选择器变更后需重新查询 DOM，避免引用失效元素。
   */
  cachedSidebarElement = null;
  cachedHeaderElement = null;
}

export { getActualThemeMode } from '../helpers/theme';

/**
 * 更新主题 CSS 变量。
 * @param preferences 偏好设置。
 * @returns 无返回值。
 */
export function updateThemeCSSVariables(preferences: Preferences): void {
  if (!hasDocument) return;

  const { theme } = preferences;
  const actualMode = getActualThemeMode(theme.mode);
  const isDark = actualMode === 'dark';

  /**
   * 同步根节点暗色类名。
   */
  toggleClass('dark', isDark);

  /**
   * 解析当前主色。
   * @description 自定义主题直接使用用户主色，内置主题按模式取预设主色。
   */
  let primaryColor: string;
  if (theme.builtinType === 'custom') {
    primaryColor = theme.colorPrimary;
  } else {
    primaryColor = getThemePrimaryColor(theme.builtinType, isDark);
  }

  /**
   * 背景跟随主色开关。
   * @description 同时传入 light/dark 两套开关，确保主题切换时变量完整。
   */
  const colorFollowPrimaryLight = preferences.app.colorFollowPrimaryLight ?? false;
  const colorFollowPrimaryDark = preferences.app.colorFollowPrimaryDark ?? false;
  const colorFollowPrimary = isDark ? colorFollowPrimaryDark : colorFollowPrimaryLight;

  /**
   * 规范化字体缩放值。
   */
  const fontScale = clampFontScale(theme.fontScale);

  /**
   * 颜色变量缓存键。
   * @description 基于关键主题参数组合，命中后可直接复用变量映射。
   */
  const cacheKey = `${primaryColor}-${isDark}-${theme.radius}-${fontScale}-${colorFollowPrimaryLight}-${colorFollowPrimaryDark}`;

  /**
   * 读取或生成颜色变量。
   */
  let colorVariables: Record<string, string>;
  if (colorVariablesCache && colorVariablesCache.key === cacheKey) {
    colorVariables = colorVariablesCache.variables;
  } else {
    /**
     * 生成颜色变量。
     * @description 传入 light/dark 两套跟随开关，兼容主题切换场景。
     */
    colorVariables = generateThemeColorVariables({
      primaryColor,
      isDark,
      colorFollowPrimary,
      colorFollowPrimaryLight,
      colorFollowPrimaryDark,
    });

    /**
     * 注入圆角变量（px）。
     * @description 将 rem 值按 16px 基准换算为 px，避免字体缩放影响圆角。
     */
    const radiusValue = parseFloat(theme.radius);
    /**
     * NaN 兜底处理。
     * @description 无法解析时回退到 `0.375rem`（6px）。
     */
    const radiusPx = (Number.isNaN(radiusValue) ? 0.375 : radiusValue) * 16;
    colorVariables['--radius'] = `${radiusPx}px`;

    /**
     * 注入字体缩放变量。
     */
    const fontScaleVars = generateFontScaleVariables(fontScale);
    Object.assign(colorVariables, fontScaleVars);

    /**
     * 更新颜色变量缓存。
     */
    colorVariablesCache = { key: cacheKey, variables: colorVariables };
  }

  /**
   * 写入 CSS 变量。
   * @description 内部会按值变化做最小化更新。
   */
  updateCSSVariables(colorVariables);
}

/**
 * 更新布局 CSS 变量。
 * @param preferences 偏好设置。
 * @returns 无返回值。
 */
export function updateLayoutCSSVariables(preferences: Preferences): void {
  if (!hasDocument) return;

  const { app, header, footer, sidebar, tabbar } = preferences;

  const layoutVariables: Record<string, string> = {
    [CSS_VAR_LAYOUT.HEADER_HEIGHT]: `${header.height}px`,
    [CSS_VAR_LAYOUT.HEADER_WIDGET_SIZE]: `${header.widgetSize}px`,
    [CSS_VAR_LAYOUT.HEADER_WIDGET_ICON_SIZE]: `${header.widgetIconSize}px`,
    [CSS_VAR_LAYOUT.HEADER_WIDGET_FONT_SIZE]: `${header.widgetFontSize}px`,
    [CSS_VAR_LAYOUT.HEADER_SEARCH_KBD_FONT_SIZE]: `${header.searchKbdFontSize}px`,
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
 * @param element 待检测元素。
 * @returns 元素是否仍在文档树中。
 */
function isElementInDOM(element: HTMLElement | null): boolean {
  return element !== null && document.body.contains(element);
}

/**
 * 获取有效的缓存元素，如果缓存失效则重新查询。
 * @param cachedElement 缓存元素。
 * @param selector 元素选择器。
 * @returns 可用的元素引用；未命中时返回 `null`。
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
 * 更新特殊模式 CSS 类。
 * @param preferences 偏好设置。
 * @returns 无返回值。
 */
export function updateSpecialModeClasses(preferences: Preferences): void {
  if (!hasDocument) return;

  const { app, theme } = preferences;

  /**
   * 同步灰色模式类名。
   */
  toggleClass('grayscale-mode', app.colorGrayMode);

  /**
   * 同步色弱模式类名。
   */
  toggleClass('color-weak-mode', app.colorWeakMode);

  /**
   * 同步侧边栏半深色类名。
   * @description 使用缓存元素并在失效时重新查询。
   */
  cachedSidebarElement = getValidElement(cachedSidebarElement, currentSelectors.sidebar);
  if (cachedSidebarElement) {
    toggleClass('semi-dark', theme.semiDarkSidebar && getActualThemeMode(theme.mode) === 'light', cachedSidebarElement);
  }

  /**
   * 同步顶栏半深色类名。
   * @description 使用缓存元素并在失效时重新查询。
   */
  cachedHeaderElement = getValidElement(cachedHeaderElement, currentSelectors.header);
  if (cachedHeaderElement) {
    toggleClass('semi-dark', theme.semiDarkHeader && getActualThemeMode(theme.mode) === 'light', cachedHeaderElement);
  }
}

/**
 * 清除 CSS 更新器缓存。
 * @description 在需要刷新缓存时调用（如 DOM 结构变化后）。
 * @returns 无返回值。
 */
export function clearCSSUpdaterCache(): void {
  clearThemeModeCache();
  colorVariablesCache = null;
  cachedSidebarElement = null;
  cachedHeaderElement = null;
}

/**
 * 更新所有 CSS 变量。
 * @param preferences 偏好设置。
 * @returns 无返回值。
 */
export function updateAllCSSVariables(preferences: Preferences): void {
  updateThemeCSSVariables(preferences);
  updateLayoutCSSVariables(preferences);
  updateSpecialModeClasses(preferences);
}
