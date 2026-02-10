/**
 * 布局工具函数
 * @module utils/layout
 * 
 * 本文件包含以下功能模块：
 * 
 * 1. 布局类型判断
 *    - getActualThemeMode, isLayoutInCategory, isFullContentLayout 等
 * 
 * 2. 布局尺寸计算
 *    - calculateSidebarWidth, calculateHeaderHeight, calculateTabbarHeight 等
 * 
 * 3. 布局计算属性与 CSS 变量
 *    - calculateLayoutComputed, generateCSSVariables
 * 
 * 4. 配置合并工具
 *    - mergeConfig, mapPreferencesToLayoutProps
 * 
 * 5. 主题工具函数
 *    - generateThemeCSSVariables, generateThemeClasses
 * 
 * 6. 水印工具函数
 *    - generateWatermarkStyle, generateWatermarkContent
 * 
 * 7. 锁屏工具函数
 *    - shouldShowLockScreen, createAutoLockTimer
 * 
 * 8. 检查更新工具
 *    - createCheckUpdatesTimer
 * 
 * 9. 配置解析
 *    - getResolvedLayoutProps, generateAllCSSVariables
 */

import {
  CSS_VAR_LAYOUT,
  createAutoLockTimer as createSharedAutoLockTimer,
  formatWatermarkText,
  getActualThemeMode,
  generateThemeCSSVariables,
  generateThemeClasses,
  mapPreferencesToLayoutProps,
  type LayoutType,
} from '@admin-core/preferences';
import {
  CSS_VAR_NAMES,
  DEFAULT_HEADER_CONFIG,
  DEFAULT_PANEL_CONFIG,
  DEFAULT_SIDEBAR_CONFIG,
  DEFAULT_TABBAR_CONFIG,
  DEFAULT_FOOTER_CONFIG,
  DEFAULT_THEME_CONFIG,
  DEFAULT_WATERMARK_CONFIG,
  DEFAULT_LOCK_SCREEN_CONFIG,
  DEFAULT_CHECK_UPDATES_CONFIG,
  LAYOUT_CATEGORIES,
} from '../constants';
import { logger } from './logger';
import type { 
  BasicLayoutProps, 
  CheckUpdatesConfig,
  LayoutComputed, 
  LayoutState, 
  LockScreenConfig,
  WatermarkConfig,
} from '../types';
export { getActualThemeMode, generateThemeCSSVariables, generateThemeClasses, mapPreferencesToLayoutProps };

// ============================================================
// 1. 布局类型判断
// ============================================================

/**
 * 判断布局是否属于某个分类
 */
export function isLayoutInCategory(
  layout: LayoutType,
  category: keyof typeof LAYOUT_CATEGORIES
): boolean {
  return (LAYOUT_CATEGORIES[category] as readonly string[]).includes(layout);
}

/**
 * 判断是否为全屏内容布局
 */
export function isFullContentLayout(layout: LayoutType): boolean {
  return layout === 'full-content';
}

/**
 * 判断是否为侧边混合导航
 */
export function isSidebarMixedNavLayout(layout: LayoutType): boolean {
  return layout === 'sidebar-mixed-nav';
}

/**
 * 判断是否为顶部导航
 */
export function isHeaderNavLayout(layout: LayoutType): boolean {
  return layout === 'header-nav';
}

/**
 * 判断是否为混合导航
 */
export function isMixedNavLayout(layout: LayoutType): boolean {
  return layout === 'mixed-nav';
}

/**
 * 判断是否为顶部混合导航
 */
export function isHeaderMixedNavLayout(layout: LayoutType): boolean {
  return layout === 'header-mixed-nav';
}

/**
 * 判断是否应该显示侧边栏
 */
export function shouldShowSidebar(layout: LayoutType, _isMobile?: boolean): boolean {
  if (isFullContentLayout(layout)) return false;
  if (isHeaderNavLayout(layout)) return false;
  return true;
}

/**
 * 判断是否应该显示顶栏
 */
export function shouldShowHeader(layout: LayoutType): boolean {
  return !isFullContentLayout(layout);
}

// ============================================================
// 2. 布局尺寸计算
// ============================================================

/**
 * 计算侧边栏宽度
 */
export function calculateSidebarWidth(
  props: BasicLayoutProps,
  state: LayoutState
): number {
  const layout = props.layout || 'sidebar-nav';
  const sidebar = { ...DEFAULT_SIDEBAR_CONFIG, ...props.sidebar };
  const isMobile = props.isMobile || false;

  // 全屏内容或顶部导航模式无侧边栏
  if (isFullContentLayout(layout) || isHeaderNavLayout(layout)) {
    return 0;
  }

  // 侧边栏隐藏
  if (sidebar.hidden) {
    return 0;
  }

  // 移动端且折叠状态
  if (isMobile && state.sidebarCollapsed) {
    return 0;
  }

  // 混合导航模式（图标列 + 子菜单面板）
  // 侧边栏宽度 = 图标列宽度 + 子菜单面板宽度（固定模式且可见时占用空间）
  if (isHeaderMixedNavLayout(layout) || isSidebarMixedNavLayout(layout)) {
    const isSidebarMixed = isSidebarMixedNavLayout(layout);
    if (!isSidebarMixed && state.sidebarCollapsed && !state.sidebarExpandOnHovering) {
      return sidebar.collapseWidth;
    }
    // 图标列宽度
    const mixedWidth = sidebar.mixedWidth || 70;
    // 子菜单面板宽度
    const extraCollapsedWidth = sidebar.extraCollapsedWidth || 60;
    const extraExpandedWidth = sidebar.width || 180;
    
    // 固定模式下（expandOnHover=false），子菜单面板占用空间
    if (!state.sidebarExpandOnHover && state.sidebarExtraVisible) {
      const extraWidth = state.sidebarExtraCollapsed ? extraCollapsedWidth : extraExpandedWidth;
      return mixedWidth + extraWidth;
    }
    // 非固定模式下，只有图标列宽度
    return mixedWidth;
  }

  // 普通折叠状态
  if (state.sidebarCollapsed && !state.sidebarExpandOnHovering) {
    return sidebar.collapseWidth;
  }

  return sidebar.width;
}

/**
 * 计算顶栏高度
 */
export function calculateHeaderHeight(
  props: BasicLayoutProps,
  state: LayoutState
): number {
  const layout = props.layout || 'sidebar-nav';
  const header = { ...DEFAULT_HEADER_CONFIG, ...props.header };

  if (isFullContentLayout(layout)) {
    return 0;
  }

  if (header.enable === false) {
    return 0;
  }

  if (header.hidden || state.headerHidden) {
    return 0;
  }

  return header.height;
}

/**
 * 计算标签栏高度
 */
export function calculateTabbarHeight(props: BasicLayoutProps): number {
  const tabbar = { ...DEFAULT_TABBAR_CONFIG, ...props.tabbar };

  if (!tabbar.enable) {
    return 0;
  }

  return tabbar.height;
}

/**
 * 计算页脚高度
 */
export function calculateFooterHeight(props: BasicLayoutProps): number {
  const footer = { ...DEFAULT_FOOTER_CONFIG, ...props.footer };

  if (!footer.enable) {
    return 0;
  }

  return footer.height;
}

/**
 * 计算功能区宽度
 */
export function calculatePanelWidth(
  props: BasicLayoutProps,
  state: LayoutState
): number {
  const panel = { ...DEFAULT_PANEL_CONFIG, ...props.panel };

  if (!panel.enable) {
    return 0;
  }

  if (state.panelCollapsed) {
    return panel.collapsedWidth;
  }

  return panel.width;
}

/**
 * 计算布局属性
 */
export function calculateLayoutComputed(
  props: BasicLayoutProps,
  state: LayoutState
): LayoutComputed {
  const layout = props.isMobile ? 'sidebar-nav' : (props.layout || 'sidebar-nav');
  const visibility = props.visibility || {};
  const header = { ...DEFAULT_HEADER_CONFIG, ...props.header };
  const tabbar = { ...DEFAULT_TABBAR_CONFIG, ...props.tabbar };

  const sidebarWidth = calculateSidebarWidth(props, state);
  const headerHeight = calculateHeaderHeight(props, state);
  const tabbarHeight = calculateTabbarHeight(props);
  const footerHeight = calculateFooterHeight(props);
  const panelWidth = calculatePanelWidth(props, state);
  const panel = { ...DEFAULT_PANEL_CONFIG, ...props.panel };

  const showSidebar = shouldShowSidebar(layout, props.isMobile || false) && visibility.sidebar !== false;
  const showHeader = shouldShowHeader(layout) && visibility.header !== false && header.enable !== false;
  const showTabbar = tabbar.enable && visibility.tabbar !== false;
  const showFooter = (props.footer?.enable ?? false) && visibility.footer !== false;
  const breadcrumbEnabled = (props.breadcrumb?.enable ?? true) && visibility.breadcrumb !== false;
  const breadcrumbDisabledLayout =
    isHeaderNavLayout(layout) || isMixedNavLayout(layout) || isHeaderMixedNavLayout(layout);
  const showBreadcrumb = breadcrumbEnabled && !breadcrumbDisabledLayout;
  const showPanel = (props.panel?.enable ?? false) && visibility.panel !== false;

  // 计算主内容区域边距
  let marginLeftValue = 0;
  if (showSidebar) {
    marginLeftValue += sidebarWidth;
  }
  if (showPanel && panel.position === 'left') {
    marginLeftValue += panelWidth;
  }
  const marginLeft = marginLeftValue > 0 ? `${marginLeftValue}px` : '0';

  const marginRight = showPanel && panel.position === 'right' ? `${panelWidth}px` : '0';

  const headerFixed = header.mode !== 'static';
  const marginTop = headerFixed ? `${headerHeight + (showTabbar ? tabbarHeight : 0)}px` : '0';

  // 计算实际主题模式（处理 auto 模式）
  const rawThemeMode = props.theme?.mode || 'light';
  const rawHeaderThemeMode = props.headerTheme ?? rawThemeMode;
  const rawSidebarThemeMode = props.sidebarTheme ?? rawThemeMode;
  const headerThemeMode: 'light' | 'dark' = getActualThemeMode(rawHeaderThemeMode);
  const sidebarThemeMode: 'light' | 'dark' = getActualThemeMode(rawSidebarThemeMode);
  
  const semiDarkSidebar = props.semiDarkSidebar ?? props.theme?.semiDarkSidebar ?? false;
  const semiDarkHeader = props.semiDarkHeader ?? props.theme?.semiDarkHeader ?? false;
  
  // 侧边栏主题计算逻辑
  // 优先级：semiDarkSidebar 设置 > 跟随全局主题
  // 当 semiDarkSidebar 为 true 且全局为 light 时，侧边栏用 dark
  // 当 semiDarkSidebar 为 false 时，侧边栏跟随全局主题
  let sidebarTheme: 'light' | 'dark';
  if (semiDarkSidebar && sidebarThemeMode === 'light') {
    sidebarTheme = 'dark';
  } else {
    sidebarTheme = sidebarThemeMode;
  }
  
  // 顶栏主题计算逻辑
  // 优先级：semiDarkHeader 设置 > 跟随全局主题
  let headerTheme: 'light' | 'dark';
  if (semiDarkHeader && headerThemeMode === 'light') {
    headerTheme = 'dark';
  } else {
    headerTheme = headerThemeMode;
  }

  return {
    currentLayout: layout,
    showSidebar,
    showHeader,
    showTabbar,
    showFooter,
    showBreadcrumb,
    showPanel,
    isFullContent: isFullContentLayout(layout),
    isSidebarMixedNav: isSidebarMixedNavLayout(layout),
    isHeaderNav: isHeaderNavLayout(layout),
    isMixedNav: isMixedNavLayout(layout),
    isHeaderMixedNav: isHeaderMixedNavLayout(layout),
    sidebarWidth,
    headerHeight,
    tabbarHeight,
    footerHeight,
    panelWidth,
    sidebarTheme,
    headerTheme,
    mainStyle: {
      marginLeft,
      marginRight,
      marginTop,
      width: `calc(100% - ${sidebarWidth + panelWidth}px)`,
    },
  };
}

// ============================================================
// 3. CSS 变量生成
// ============================================================

/**
 * 生成 CSS 变量对象
 */
export function generateCSSVariables(props: BasicLayoutProps, state: LayoutState): Record<string, string> {
  const header = { ...DEFAULT_HEADER_CONFIG, ...props.header };
  const sidebar = { ...DEFAULT_SIDEBAR_CONFIG, ...props.sidebar };
  const tabbar = { ...DEFAULT_TABBAR_CONFIG, ...props.tabbar };
  const footer = { ...DEFAULT_FOOTER_CONFIG, ...props.footer };
  const panel = { ...DEFAULT_PANEL_CONFIG, ...props.panel };
  const visibility = props.visibility || {};
  const showPanel = (props.panel?.enable ?? false) && visibility.panel !== false;
  const zIndex = props.zIndex || 200;

  const sidebarWidth = calculateSidebarWidth(props, state);
  const panelWidth = calculatePanelWidth(props, state);

  const adminVars: Record<string, string> = {
    [CSS_VAR_LAYOUT.HEADER_HEIGHT]: `${header.height}px`,
    [CSS_VAR_LAYOUT.SIDEBAR_WIDTH]: `${sidebarWidth}px`,
    [CSS_VAR_LAYOUT.SIDEBAR_COLLAPSED_WIDTH]: `${sidebar.collapseWidth}px`,
    [CSS_VAR_LAYOUT.TABBAR_HEIGHT]: `${tabbar.height}px`,
    [CSS_VAR_LAYOUT.FOOTER_HEIGHT]: `${footer.height}px`,
    [CSS_VAR_LAYOUT.CONTENT_PADDING]: `${props.contentPadding ?? 16}px`,
    [CSS_VAR_LAYOUT.CONTENT_PADDING_TOP]: `${props.contentPaddingTop ?? props.contentPadding ?? 16}px`,
    [CSS_VAR_LAYOUT.CONTENT_PADDING_BOTTOM]: `${props.contentPaddingBottom ?? props.contentPadding ?? 16}px`,
    [CSS_VAR_LAYOUT.CONTENT_PADDING_LEFT]: `${props.contentPaddingLeft ?? props.contentPadding ?? 16}px`,
    [CSS_VAR_LAYOUT.CONTENT_PADDING_RIGHT]: `${props.contentPaddingRight ?? props.contentPadding ?? 16}px`,
  };

  const panelOffsetLeft = showPanel && panel.position === 'left' ? panelWidth : 0;
  const panelOffsetRight = showPanel && panel.position === 'right' ? panelWidth : 0;

  const layoutOnlyVars: Record<string, string> = {
    [CSS_VAR_NAMES.sidebarMixedWidth]: `${sidebar.mixedWidth}px`,
    [CSS_VAR_NAMES.panelWidth]: `${panelWidth}px`,
    [CSS_VAR_NAMES.panelCollapseWidth]: `${panel.collapsedWidth}px`,
    [CSS_VAR_NAMES.panelOffsetLeft]: `${panelOffsetLeft}px`,
    [CSS_VAR_NAMES.panelOffsetRight]: `${panelOffsetRight}px`,
    [CSS_VAR_NAMES.contentCompactWidth]: `${props.contentCompactWidth ?? 1200}px`,
    [CSS_VAR_NAMES.zIndex]: `${zIndex}`,
    [CSS_VAR_NAMES.zIndexHeader]: `${zIndex + 30}`,
    [CSS_VAR_NAMES.zIndexSidebar]: `${zIndex + 20}`,
    [CSS_VAR_NAMES.zIndexTabbar]: `${zIndex + 5}`,
    [CSS_VAR_NAMES.zIndexPanel]: `${zIndex + 15}`,
    [CSS_VAR_NAMES.zIndexOverlay]: `${zIndex + 50}`,
  };

  return { ...adminVars, ...layoutOnlyVars };
}
// ============================================================
// 4. 配置合并工具
// ============================================================

/**
 * 合并配置（深度合并）
 */
export function mergeConfig<T extends object>(
  defaults: T,
  overrides?: Partial<T>
): T {
  if (!overrides) return { ...defaults };

  const result = { ...defaults } as T;

  for (const key in overrides) {
    if (Object.prototype.hasOwnProperty.call(overrides, key)) {
      const value = overrides[key as keyof T];
      if (value !== undefined) {
        const defaultValue = defaults[key as keyof T];
        if (
          typeof value === 'object' &&
          value !== null &&
          !Array.isArray(value) &&
          typeof defaultValue === 'object' &&
          defaultValue !== null
        ) {
          (result as Record<string, unknown>)[key] = mergeConfig(
            defaultValue as Record<string, unknown>,
            value as Record<string, unknown>
          );
        } else {
          (result as Record<string, unknown>)[key] = value;
        }
      }
    }
  }

  return result;
}

// ============================================================
// 6. 水印工具函数
// ============================================================

/**
 * 生成水印配置
 */
export function generateWatermarkStyle(config: WatermarkConfig = DEFAULT_WATERMARK_CONFIG): Record<string, string | number> {
  if (!config.enable) {
    return { display: 'none' };
  }

  return {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: config.zIndex || 9999,
    opacity: config.opacity || 1,
  };
}

/**
 * 生成水印内容
 */
export function generateWatermarkContent(config: WatermarkConfig = DEFAULT_WATERMARK_CONFIG): string {
  return formatWatermarkText({
    content: config.content,
    appendDate: config.appendDate,
  });
}

// ============================================================
// 7. 锁屏工具函数
// ============================================================

/**
 * 检查是否应该显示锁屏
 */
export function shouldShowLockScreen(config: LockScreenConfig = DEFAULT_LOCK_SCREEN_CONFIG): boolean {
  return config.isLocked === true;
}

/**
 * 创建自动锁屏定时器
 * @returns 清理函数
 */
export function createAutoLockTimer(
  config: LockScreenConfig,
  onLock: () => void
): () => void {
  if (!config.autoLockTime || config.autoLockTime <= 0) {
    return () => {};
  }

  return createSharedAutoLockTimer({
    getAutoLockTime: () => config.autoLockTime ?? 0,
    isLocked: () => config.isLocked === true,
    onLock,
    // 保持原有事件列表与无节流行为
    events: ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'],
    throttleMs: 0,
    target: typeof document !== 'undefined' ? document : undefined,
  });
}

// ============================================================
// 8. 检查更新工具
// ============================================================

/**
 * 检查更新工具
 */
export function createCheckUpdatesTimer(
  config: CheckUpdatesConfig,
  onUpdate: (hasUpdate: boolean) => void,
  checkFn: () => Promise<boolean>
): () => void {
  if (!config.enable || !config.interval || config.interval <= 0) {
    return () => {};
  }

  const interval = config.interval * 60 * 1000; // 转换为毫秒
  let timer: ReturnType<typeof setInterval> | null = null;

  const check = async () => {
    try {
      const hasUpdate = await checkFn();
      onUpdate(hasUpdate);
    } catch (error) {
      logger.error('Check updates failed:', error);
    }
  };

  // 启动定时器
  timer = setInterval(check, interval);

  // 立即检查一次
  check();

  // 返回清理函数
  return () => {
    if (timer) {
      clearInterval(timer);
    }
  };
}

// ============================================================
// 9. 配置解析
// ============================================================

/**
 * 获取完整的布局 Props（合并 preferences 和单独配置）
 * @description 优先级：单独配置项 > preferences 对象 > 默认值
 */
export function getResolvedLayoutProps(props: BasicLayoutProps): BasicLayoutProps {
  // 如果传入了 preferences 对象，先映射
  let baseProps: Partial<BasicLayoutProps> = {};
  if (props.preferences) {
    baseProps = mapPreferencesToLayoutProps(props.preferences);
  }

  // 合并配置（单独配置优先）
  return {
    ...baseProps,
    ...props,
    // 深度合并对象类型的配置
    theme: mergeConfig(
      DEFAULT_THEME_CONFIG,
      mergeConfig(baseProps.theme || {}, props.theme || {})
    ),
    watermark: mergeConfig(
      DEFAULT_WATERMARK_CONFIG,
      mergeConfig(baseProps.watermark || {}, props.watermark || {})
    ),
    lockScreen: mergeConfig(
      DEFAULT_LOCK_SCREEN_CONFIG,
      mergeConfig(baseProps.lockScreen || {}, props.lockScreen || {})
    ),
    checkUpdates: mergeConfig(
      DEFAULT_CHECK_UPDATES_CONFIG,
      mergeConfig(baseProps.checkUpdates || {}, props.checkUpdates || {})
    ),
    header: mergeConfig(
      DEFAULT_HEADER_CONFIG,
      mergeConfig(baseProps.header || {}, props.header || {})
    ),
    sidebar: mergeConfig(
      DEFAULT_SIDEBAR_CONFIG,
      mergeConfig(baseProps.sidebar || {}, props.sidebar || {})
    ),
    tabbar: mergeConfig(
      DEFAULT_TABBAR_CONFIG,
      mergeConfig(baseProps.tabbar || {}, props.tabbar || {})
    ),
    footer: mergeConfig(
      DEFAULT_FOOTER_CONFIG,
      mergeConfig(baseProps.footer || {}, props.footer || {})
    ),
    panel: mergeConfig(
      DEFAULT_PANEL_CONFIG,
      mergeConfig(baseProps.panel || {}, props.panel || {})
    ),
  } as BasicLayoutProps;
}

/**
 * 生成所有 CSS 变量（布局 + 主题）
 */
export function generateAllCSSVariables(props: BasicLayoutProps, state: LayoutState): Record<string, string> {
  const layoutVars = generateCSSVariables(props, state);
  const themeVars = generateThemeCSSVariables(props.theme);

  return {
    ...layoutVars,
    ...themeVars,
  };
}
