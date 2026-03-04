/**
 * Shared Core 布局分类工具。
 * @description 提供布局类型分组、能力判断与导航位置解析函数。
 */
/**
 * 布局分类映射表。
 * @description 按导航结构聚合布局标识，用于布局能力判断与快捷筛选。
 */
export const LAYOUT_CATEGORIES = {
  headerMenu: ['header-nav', 'mixed-nav', 'header-mixed-nav'] as const,
  sidebarMenu: ['sidebar-nav', 'sidebar-mixed-nav', 'header-sidebar-nav'] as const,
  mixed: ['mixed-nav', 'header-mixed-nav', 'sidebar-mixed-nav'] as const,
  fullContent: ['full-content'] as const,
  all: [
    'sidebar-nav',
    'sidebar-mixed-nav',
    'header-nav',
    'header-sidebar-nav',
    'mixed-nav',
    'header-mixed-nav',
    'full-content',
  ] as const,
};

/**
 * 布局分类键类型。
 */
export type LayoutCategoryKey = keyof typeof LAYOUT_CATEGORIES;

/**
 * 判断布局是否属于指定分类。
 * @param layout 布局类型。
 * @param category 分类键。
 * @returns 是否命中分类。
 */
export function isLayoutInCategory(layout: string, category: LayoutCategoryKey): boolean {
  return (LAYOUT_CATEGORIES[category] as readonly string[]).includes(layout);
}

/**
 * 判断是否为头部导航布局。
 * @param layout 布局类型。
 * @returns 是否为头部导航布局。
 */
export function isHeaderMenuLayout(layout: string): boolean {
  return isLayoutInCategory(layout, 'headerMenu');
}

/**
 * 判断是否为侧边导航布局。
 * @param layout 布局类型。
 * @returns 是否为侧边导航布局。
 */
export function isSidebarMenuLayout(layout: string): boolean {
  return isLayoutInCategory(layout, 'sidebarMenu');
}

/**
 * 判断是否为混合导航布局。
 * @param layout 布局类型。
 * @returns 是否为混合导航布局。
 */
export function isMixedLayout(layout: string): boolean {
  return isLayoutInCategory(layout, 'mixed');
}

/**
 * 判断是否为全内容布局。
 * @param layout 布局类型。
 * @returns 是否为全内容布局。
 */
export function isFullContentLayout(layout: string): boolean {
  return layout === 'full-content';
}

/**
 * 判断布局是否包含侧边栏。
 * @param layout 布局类型。
 * @returns 是否包含侧边栏。
 */
export function hasSidebar(layout: string): boolean {
  return layout !== 'header-nav' && layout !== 'full-content';
}

/**
 * 判断布局是否包含头部菜单。
 * @param layout 布局类型。
 * @returns 是否包含头部菜单。
 */
export function hasHeaderMenu(layout: string): boolean {
  return isHeaderMenuLayout(layout);
}

/**
 * 获取布局导航位置类型。
 * @param layout 布局类型。
 * @returns 导航位置：头部、侧边、双端或无导航。
 */
export function getNavigationPosition(layout: string): 'header' | 'sidebar' | 'both' | 'none' {
  if (isFullContentLayout(layout)) return 'none';
  if (isMixedLayout(layout)) return 'both';
  if (isHeaderMenuLayout(layout)) return 'header';
  return 'sidebar';
}
