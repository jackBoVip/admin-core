/**
 * 布局图标
 * @description SVG 图标字符串，供 Vue/React 包装使用
 */

import type { LayoutType } from '../types';

/**
 * 布局图标 SVG
 * @description 用于布局选择器显示
 */
export const layoutIcons: Record<LayoutType, string> = {
  // 侧边导航
  'sidebar-nav': `<svg viewBox="0 0 100 70" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="70" rx="4" fill="currentColor" fill-opacity="0.1"/>
    <rect x="2" y="2" width="20" height="66" rx="2" fill="currentColor" fill-opacity="0.4"/>
    <rect x="24" y="2" width="74" height="10" rx="2" fill="currentColor" fill-opacity="0.3"/>
    <rect x="24" y="14" width="74" height="54" rx="2" fill="currentColor" fill-opacity="0.2"/>
  </svg>`,

  // 侧边混合导航
  'sidebar-mixed-nav': `<svg viewBox="0 0 100 70" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="70" rx="4" fill="currentColor" fill-opacity="0.1"/>
    <rect x="2" y="2" width="12" height="66" rx="2" fill="currentColor" fill-opacity="0.4"/>
    <rect x="16" y="2" width="16" height="66" rx="2" fill="currentColor" fill-opacity="0.3"/>
    <rect x="34" y="2" width="64" height="10" rx="2" fill="currentColor" fill-opacity="0.3"/>
    <rect x="34" y="14" width="64" height="54" rx="2" fill="currentColor" fill-opacity="0.2"/>
  </svg>`,

  // 顶部导航
  'header-nav': `<svg viewBox="0 0 100 70" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="70" rx="4" fill="currentColor" fill-opacity="0.1"/>
    <rect x="2" y="2" width="96" height="12" rx="2" fill="currentColor" fill-opacity="0.4"/>
    <rect x="2" y="16" width="96" height="52" rx="2" fill="currentColor" fill-opacity="0.2"/>
  </svg>`,

  // 顶部通栏+侧边导航
  'header-sidebar-nav': `<svg viewBox="0 0 100 70" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="70" rx="4" fill="currentColor" fill-opacity="0.1"/>
    <rect x="2" y="2" width="96" height="10" rx="2" fill="currentColor" fill-opacity="0.4"/>
    <rect x="2" y="14" width="20" height="54" rx="2" fill="currentColor" fill-opacity="0.3"/>
    <rect x="24" y="14" width="74" height="54" rx="2" fill="currentColor" fill-opacity="0.2"/>
  </svg>`,

  // 混合导航
  'mixed-nav': `<svg viewBox="0 0 100 70" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="70" rx="4" fill="currentColor" fill-opacity="0.1"/>
    <rect x="2" y="2" width="96" height="10" rx="2" fill="currentColor" fill-opacity="0.4"/>
    <rect x="2" y="14" width="20" height="54" rx="2" fill="currentColor" fill-opacity="0.3"/>
    <rect x="24" y="14" width="74" height="54" rx="2" fill="currentColor" fill-opacity="0.2"/>
  </svg>`,

  // 顶部混合导航
  'header-mixed-nav': `<svg viewBox="0 0 100 70" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="70" rx="4" fill="currentColor" fill-opacity="0.1"/>
    <rect x="2" y="2" width="96" height="12" rx="2" fill="currentColor" fill-opacity="0.4"/>
    <rect x="2" y="16" width="18" height="52" rx="2" fill="currentColor" fill-opacity="0.3"/>
    <rect x="22" y="16" width="76" height="52" rx="2" fill="currentColor" fill-opacity="0.2"/>
  </svg>`,

  // 全屏内容
  'full-content': `<svg viewBox="0 0 100 70" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="70" rx="4" fill="currentColor" fill-opacity="0.1"/>
    <rect x="2" y="2" width="96" height="66" rx="2" fill="currentColor" fill-opacity="0.2"/>
  </svg>`,
};

/**
 * 获取布局图标
 * @param layout - 布局类型
 * @returns SVG 字符串
 */
export function getLayoutIcon(layout: LayoutType): string {
  return layoutIcons[layout] ?? layoutIcons['sidebar-nav'];
}
