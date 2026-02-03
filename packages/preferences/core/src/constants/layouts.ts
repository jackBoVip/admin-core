/**
 * 布局常量
 */

import type {
  LayoutType,
  TabsStyleType,
  NavigationStyleType,
  BreadcrumbStyleType,
  LayoutHeaderModeType,
  LayoutHeaderMenuAlignType,
  ContentCompactType,
} from '../types';

/**
 * 布局类型选项
 * @description label 和 description 使用 i18n key，需要在 UI 层翻译
 */
export const LAYOUT_OPTIONS: Array<{
  /** i18n key for label */
  labelKey: string;
  value: LayoutType;
  /** i18n key for description */
  descriptionKey: string;
}> = [
  {
    labelKey: 'layout.sidebarNav',
    value: 'sidebar-nav',
    descriptionKey: 'layout.sidebarNavDesc',
  },
  {
    labelKey: 'layout.sidebarMixedNav',
    value: 'sidebar-mixed-nav',
    descriptionKey: 'layout.sidebarMixedNavDesc',
  },
  {
    labelKey: 'layout.headerNav',
    value: 'header-nav',
    descriptionKey: 'layout.headerNavDesc',
  },
  {
    labelKey: 'layout.headerSidebarNav',
    value: 'header-sidebar-nav',
    descriptionKey: 'layout.headerSidebarNavDesc',
  },
  {
    labelKey: 'layout.mixedNav',
    value: 'mixed-nav',
    descriptionKey: 'layout.mixedNavDesc',
  },
  {
    labelKey: 'layout.headerMixedNav',
    value: 'header-mixed-nav',
    descriptionKey: 'layout.headerMixedNavDesc',
  },
  {
    labelKey: 'layout.fullContent',
    value: 'full-content',
    descriptionKey: 'layout.fullContentDesc',
  },
];

/**
 * 标签栏样式选项
 */
export const TABS_STYLE_OPTIONS: Array<{
  labelKey: string;
  value: TabsStyleType;
}> = [
  { labelKey: 'tabbar.styleChrome', value: 'chrome' },
  { labelKey: 'tabbar.styleCard', value: 'card' },
  { labelKey: 'tabbar.stylePlain', value: 'plain' },
  { labelKey: 'tabbar.styleBrisk', value: 'brisk' },
];

/**
 * 导航风格选项
 */
export const NAVIGATION_STYLE_OPTIONS: Array<{
  labelKey: string;
  value: NavigationStyleType;
}> = [
  { labelKey: 'navigation.styleRounded', value: 'rounded' },
  { labelKey: 'navigation.stylePlain', value: 'plain' },
];

/**
 * 面包屑样式选项
 */
export const BREADCRUMB_STYLE_OPTIONS: Array<{
  labelKey: string;
  value: BreadcrumbStyleType;
}> = [
  { labelKey: 'breadcrumb.styleNormal', value: 'normal' },
  { labelKey: 'breadcrumb.styleBackground', value: 'background' },
];

/**
 * 顶栏模式选项
 */
export const HEADER_MODE_OPTIONS: Array<{
  labelKey: string;
  value: LayoutHeaderModeType;
}> = [
  { labelKey: 'header.modeFixed', value: 'fixed' },
  { labelKey: 'header.modeStatic', value: 'static' },
  { labelKey: 'header.modeAuto', value: 'auto' },
  { labelKey: 'header.modeAutoScroll', value: 'auto-scroll' },
];

/**
 * 顶栏菜单对齐选项
 */
export const HEADER_MENU_ALIGN_OPTIONS: Array<{
  labelKey: string;
  value: LayoutHeaderMenuAlignType;
}> = [
  { labelKey: 'header.menuAlignStart', value: 'start' },
  { labelKey: 'header.menuAlignCenter', value: 'center' },
  { labelKey: 'header.menuAlignEnd', value: 'end' },
];

/**
 * 内容宽度模式选项
 */
export const CONTENT_COMPACT_OPTIONS: Array<{
  labelKey: string;
  value: ContentCompactType;
}> = [
  { labelKey: 'layout.contentWide', value: 'wide' },
  { labelKey: 'layout.contentCompact', value: 'compact' },
];

/**
 * 布局默认尺寸配置
 */
export const DEFAULT_LAYOUT_SIZES = {
  /** 顶栏高度 (px) */
  headerHeight: 50,
  /** 页脚高度 (px) */
  footerHeight: 32,
  /** 侧边栏宽度 (px) */
  sidebarWidth: 224,
  /** 侧边栏折叠宽度 (px) */
  sidebarCollapsedWidth: 60,
  /** 混合模式侧边栏宽度 (px) */
  sidebarMixedWidth: 80,
  /** 标签栏高度 (px) */
  tabbarHeight: 38,
  /** 内容最大宽度（紧凑模式）(px) */
  contentMaxWidth: 1200,
  /** 内容内边距 (px) */
  contentPadding: 16,
} as const;

const LAYOUT_OPTION_MAP = new Map<LayoutType, typeof LAYOUT_OPTIONS[number]>(
  LAYOUT_OPTIONS.map((opt) => [opt.value, opt])
);

/**
 * 获取布局 i18n key
 * @param layout - 布局类型
 * @returns i18n key
 */
export function getLayoutLabelKey(layout: LayoutType): string {
  const option = LAYOUT_OPTION_MAP.get(layout);
  return option?.labelKey ?? `layout.${layout}`;
}

/**
 * 获取布局显示名称（已弃用，请使用 getLayoutLabelKey）
 * @deprecated 请使用 getLayoutLabelKey 配合 i18n 获取显示名称
 * @param layout - 布局类型
 * @returns i18n key
 */
export function getLayoutLabel(layout: LayoutType): string {
  return getLayoutLabelKey(layout);
}
