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

export type LayoutCategoryKey = keyof typeof LAYOUT_CATEGORIES;

export function isLayoutInCategory(layout: string, category: LayoutCategoryKey): boolean {
  return (LAYOUT_CATEGORIES[category] as readonly string[]).includes(layout);
}

export function isHeaderMenuLayout(layout: string): boolean {
  return isLayoutInCategory(layout, 'headerMenu');
}

export function isSidebarMenuLayout(layout: string): boolean {
  return isLayoutInCategory(layout, 'sidebarMenu');
}

export function isMixedLayout(layout: string): boolean {
  return isLayoutInCategory(layout, 'mixed');
}

export function isFullContentLayout(layout: string): boolean {
  return layout === 'full-content';
}

export function hasSidebar(layout: string): boolean {
  return layout !== 'header-nav' && layout !== 'full-content';
}

export function hasHeaderMenu(layout: string): boolean {
  return isHeaderMenuLayout(layout);
}

export function getNavigationPosition(layout: string): 'header' | 'sidebar' | 'both' | 'none' {
  if (isFullContentLayout(layout)) return 'none';
  if (isMixedLayout(layout)) return 'both';
  if (isHeaderMenuLayout(layout)) return 'header';
  return 'sidebar';
}
