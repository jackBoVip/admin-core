/**
 * 布局图标
 * @description SVG 图标字符串，供 Vue/React 包装使用
 * @reference Vben Admin 风格的布局预览图标
 */

import type { LayoutType } from '../types';

/**
 * 布局图标 SVG
 * @description 用于布局选择器显示，与 Vben Admin 保持一致
 * viewBox: 80x50 (紧凑尺寸)
 */
export const layoutIcons: Record<LayoutType, string> = {
  // 侧边导航 (sidebar-nav) - 垂直布局
  'sidebar-nav': `<svg viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="50" rx="3" fill="var(--muted)"/>
    <!-- 侧边栏 -->
    <rect x="0" y="0" width="18" height="50" rx="3" fill="hsl(var(--primary))"/>
    <!-- Logo -->
    <rect x="5" y="4" width="8" height="4" rx="1" fill="white" fill-opacity="0.9"/>
    <!-- 菜单项 -->
    <rect x="3" y="14" width="12" height="2" rx="1" fill="white" fill-opacity="0.5"/>
    <rect x="3" y="20" width="12" height="2" rx="1" fill="white" fill-opacity="0.8"/>
    <rect x="3" y="26" width="12" height="2" rx="1" fill="white" fill-opacity="0.5"/>
    <rect x="3" y="32" width="12" height="2" rx="1" fill="white" fill-opacity="0.5"/>
    <!-- 顶栏 -->
    <rect x="20" y="2" width="58" height="8" rx="2" fill="var(--background)"/>
    <!-- 工具栏图标 -->
    <circle cx="60" cy="6" r="2" fill="var(--muted-foreground)" fill-opacity="0.4"/>
    <circle cx="67" cy="6" r="2" fill="var(--muted-foreground)" fill-opacity="0.4"/>
    <circle cx="74" cy="6" r="2" fill="var(--muted-foreground)" fill-opacity="0.4"/>
    <!-- 内容区 -->
    <rect x="20" y="12" width="28" height="16" rx="2" fill="var(--background)"/>
    <rect x="50" y="12" width="28" height="16" rx="2" fill="var(--background)"/>
    <rect x="20" y="30" width="58" height="18" rx="2" fill="var(--background)"/>
  </svg>`,

  // 侧边混合导航 (sidebar-mixed-nav) - 双列菜单
  'sidebar-mixed-nav': `<svg viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="50" rx="3" fill="var(--muted)"/>
    <!-- 一级侧边栏 -->
    <rect x="0" y="0" width="10" height="50" rx="3" fill="hsl(var(--primary))"/>
    <!-- 图标 -->
    <rect x="2" y="3" width="6" height="6" rx="1.5" fill="white" fill-opacity="0.9"/>
    <rect x="2" y="13" width="6" height="4" rx="1" fill="white" fill-opacity="0.5"/>
    <rect x="2" y="20" width="6" height="4" rx="1" fill="white" fill-opacity="0.8"/>
    <rect x="2" y="27" width="6" height="4" rx="1" fill="white" fill-opacity="0.5"/>
    <rect x="2" y="34" width="6" height="4" rx="1" fill="white" fill-opacity="0.5"/>
    <!-- 二级侧边栏 -->
    <rect x="10" y="0" width="14" height="50" fill="var(--background)"/>
    <rect x="12" y="14" width="10" height="2" rx="1" fill="var(--muted-foreground)" fill-opacity="0.3"/>
    <rect x="12" y="20" width="10" height="2" rx="1" fill="var(--muted-foreground)" fill-opacity="0.5"/>
    <rect x="12" y="26" width="10" height="2" rx="1" fill="var(--muted-foreground)" fill-opacity="0.3"/>
    <!-- 顶栏 -->
    <rect x="26" y="2" width="52" height="8" rx="2" fill="var(--background)"/>
    <!-- 工具栏图标 -->
    <circle cx="60" cy="6" r="2" fill="var(--muted-foreground)" fill-opacity="0.4"/>
    <circle cx="67" cy="6" r="2" fill="var(--muted-foreground)" fill-opacity="0.4"/>
    <circle cx="74" cy="6" r="2" fill="var(--muted-foreground)" fill-opacity="0.4"/>
    <!-- 内容区 -->
    <rect x="26" y="12" width="24" height="16" rx="2" fill="var(--background)"/>
    <rect x="52" y="12" width="26" height="16" rx="2" fill="var(--background)"/>
    <rect x="26" y="30" width="52" height="18" rx="2" fill="var(--background)"/>
  </svg>`,

  // 顶部导航 (header-nav) - 水平布局
  'header-nav': `<svg viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="50" rx="3" fill="var(--muted)"/>
    <!-- 顶栏 -->
    <rect x="0" y="0" width="80" height="10" rx="3" fill="hsl(var(--primary))"/>
    <!-- Logo -->
    <rect x="4" y="2" width="8" height="6" rx="1.5" fill="white" fill-opacity="0.9"/>
    <!-- 菜单项 -->
    <rect x="16" y="4" width="8" height="2" rx="1" fill="white" fill-opacity="0.5"/>
    <rect x="28" y="4" width="8" height="2" rx="1" fill="white" fill-opacity="0.8"/>
    <rect x="40" y="4" width="8" height="2" rx="1" fill="white" fill-opacity="0.5"/>
    <rect x="52" y="4" width="8" height="2" rx="1" fill="white" fill-opacity="0.5"/>
    <!-- 工具栏图标 -->
    <circle cx="68" cy="5" r="2" fill="white" fill-opacity="0.6"/>
    <circle cx="75" cy="5" r="2" fill="white" fill-opacity="0.6"/>
    <!-- 内容区 -->
    <rect x="2" y="12" width="36" height="16" rx="2" fill="var(--background)"/>
    <rect x="40" y="12" width="38" height="16" rx="2" fill="var(--background)"/>
    <rect x="2" y="30" width="76" height="18" rx="2" fill="var(--background)"/>
  </svg>`,

  // 顶部通栏 (header-sidebar-nav) - 侧边导航
  'header-sidebar-nav': `<svg viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="50" rx="3" fill="var(--muted)"/>
    <!-- 顶栏 -->
    <rect x="0" y="0" width="80" height="10" rx="3" fill="var(--background)"/>
    <!-- Logo -->
    <rect x="4" y="2" width="8" height="6" rx="1.5" fill="hsl(var(--primary))"/>
    <!-- 菜单项 -->
    <rect x="16" y="4" width="8" height="2" rx="1" fill="var(--muted-foreground)" fill-opacity="0.4"/>
    <rect x="28" y="4" width="8" height="2" rx="1" fill="var(--muted-foreground)" fill-opacity="0.6"/>
    <rect x="40" y="4" width="8" height="2" rx="1" fill="var(--muted-foreground)" fill-opacity="0.4"/>
    <!-- 工具栏图标 -->
    <circle cx="68" cy="5" r="2" fill="var(--muted-foreground)" fill-opacity="0.4"/>
    <circle cx="75" cy="5" r="2" fill="var(--muted-foreground)" fill-opacity="0.4"/>
    <!-- 侧边栏 -->
    <rect x="0" y="10" width="18" height="40" fill="hsl(var(--primary))"/>
    <!-- 侧边菜单 -->
    <rect x="3" y="14" width="12" height="2" rx="1" fill="white" fill-opacity="0.5"/>
    <rect x="3" y="20" width="12" height="2" rx="1" fill="white" fill-opacity="0.8"/>
    <rect x="3" y="26" width="12" height="2" rx="1" fill="white" fill-opacity="0.5"/>
    <rect x="3" y="32" width="12" height="2" rx="1" fill="white" fill-opacity="0.5"/>
    <!-- 内容区 -->
    <rect x="20" y="12" width="28" height="16" rx="2" fill="var(--background)"/>
    <rect x="50" y="12" width="28" height="16" rx="2" fill="var(--background)"/>
    <rect x="20" y="30" width="58" height="18" rx="2" fill="var(--background)"/>
  </svg>`,

  // 混合导航 (mixed-nav) - 混合垂直
  'mixed-nav': `<svg viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="50" rx="3" fill="var(--muted)"/>
    <!-- 顶栏 -->
    <rect x="0" y="0" width="80" height="10" rx="3" fill="hsl(var(--primary))"/>
    <!-- Logo -->
    <rect x="4" y="2" width="8" height="6" rx="1.5" fill="white" fill-opacity="0.9"/>
    <!-- 菜单项 -->
    <rect x="16" y="4" width="8" height="2" rx="1" fill="white" fill-opacity="0.5"/>
    <rect x="28" y="4" width="8" height="2" rx="1" fill="white" fill-opacity="0.8"/>
    <rect x="40" y="4" width="8" height="2" rx="1" fill="white" fill-opacity="0.5"/>
    <!-- 工具栏图标 -->
    <circle cx="68" cy="5" r="2" fill="white" fill-opacity="0.6"/>
    <circle cx="75" cy="5" r="2" fill="white" fill-opacity="0.6"/>
    <!-- 二级侧边栏 -->
    <rect x="0" y="10" width="18" height="40" fill="var(--background)"/>
    <rect x="3" y="14" width="12" height="2" rx="1" fill="var(--muted-foreground)" fill-opacity="0.4"/>
    <rect x="3" y="20" width="12" height="2" rx="1" fill="var(--muted-foreground)" fill-opacity="0.6"/>
    <rect x="3" y="26" width="12" height="2" rx="1" fill="var(--muted-foreground)" fill-opacity="0.4"/>
    <rect x="3" y="32" width="12" height="2" rx="1" fill="var(--muted-foreground)" fill-opacity="0.4"/>
    <!-- 内容区 -->
    <rect x="20" y="12" width="28" height="16" rx="2" fill="var(--background)"/>
    <rect x="50" y="12" width="28" height="16" rx="2" fill="var(--background)"/>
    <rect x="20" y="30" width="58" height="18" rx="2" fill="var(--background)"/>
  </svg>`,

  // 顶部混合导航 (header-mixed-nav) - 混合双列
  'header-mixed-nav': `<svg viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="50" rx="3" fill="var(--muted)"/>
    <!-- 顶栏 -->
    <rect x="0" y="0" width="80" height="10" rx="3" fill="var(--background)"/>
    <!-- Logo -->
    <rect x="4" y="2" width="8" height="6" rx="1.5" fill="hsl(var(--primary))"/>
    <!-- 菜单项 -->
    <rect x="16" y="4" width="8" height="2" rx="1" fill="var(--muted-foreground)" fill-opacity="0.4"/>
    <rect x="28" y="4" width="8" height="2" rx="1" fill="var(--muted-foreground)" fill-opacity="0.6"/>
    <rect x="40" y="4" width="8" height="2" rx="1" fill="var(--muted-foreground)" fill-opacity="0.4"/>
    <!-- 工具栏图标 -->
    <circle cx="68" cy="5" r="2" fill="var(--muted-foreground)" fill-opacity="0.4"/>
    <circle cx="75" cy="5" r="2" fill="var(--muted-foreground)" fill-opacity="0.4"/>
    <!-- 侧边栏 -->
    <rect x="0" y="10" width="18" height="40" fill="hsl(var(--primary))"/>
    <!-- 侧边菜单 -->
    <rect x="3" y="14" width="12" height="2" rx="1" fill="white" fill-opacity="0.5"/>
    <rect x="3" y="20" width="12" height="2" rx="1" fill="white" fill-opacity="0.8"/>
    <rect x="3" y="26" width="12" height="2" rx="1" fill="white" fill-opacity="0.5"/>
    <rect x="3" y="32" width="12" height="2" rx="1" fill="white" fill-opacity="0.5"/>
    <!-- 内容区 -->
    <rect x="20" y="12" width="28" height="16" rx="2" fill="var(--background)"/>
    <rect x="50" y="12" width="28" height="16" rx="2" fill="var(--background)"/>
    <rect x="20" y="30" width="58" height="18" rx="2" fill="var(--background)"/>
  </svg>`,

  // 全屏内容 (full-content) - 内容全屏
  'full-content': `<svg viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="50" rx="3" fill="var(--muted)"/>
    <!-- 全屏内容区 -->
    <rect x="2" y="2" width="76" height="46" rx="2" fill="var(--background)"/>
    <!-- 内容占位 -->
    <rect x="6" y="6" width="30" height="4" rx="1" fill="var(--muted-foreground)" fill-opacity="0.2"/>
    <rect x="6" y="14" width="68" height="12" rx="2" fill="var(--muted)" fill-opacity="0.5"/>
    <rect x="6" y="30" width="32" height="16" rx="2" fill="var(--muted)" fill-opacity="0.5"/>
    <rect x="42" y="30" width="32" height="16" rx="2" fill="var(--muted)" fill-opacity="0.5"/>
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

/**
 * 内容宽度类型
 */
export type ContentWidthType = 'wide' | 'compact';

/**
 * 内容宽度图标 SVG
 * @description 用于内容宽度选择器显示
 */
export const contentWidthIcons: Record<ContentWidthType, string> = {
  // 流式/宽屏模式 - 内容铺满
  wide: `<svg viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="50" rx="3" fill="var(--muted)"/>
    <!-- 侧边栏 -->
    <rect x="0" y="0" width="18" height="50" rx="3" fill="hsl(var(--primary))"/>
    <!-- Logo -->
    <rect x="5" y="4" width="8" height="4" rx="1" fill="white" fill-opacity="0.9"/>
    <!-- 菜单项 -->
    <rect x="3" y="14" width="12" height="2" rx="1" fill="white" fill-opacity="0.5"/>
    <rect x="3" y="20" width="12" height="2" rx="1" fill="white" fill-opacity="0.8"/>
    <rect x="3" y="26" width="12" height="2" rx="1" fill="white" fill-opacity="0.5"/>
    <!-- 顶栏 -->
    <rect x="20" y="2" width="58" height="8" rx="2" fill="var(--background)"/>
    <!-- 内容区 (宽) - 高亮显示 -->
    <rect x="20" y="12" width="58" height="36" rx="2" fill="hsl(var(--primary))" fill-opacity="0.15"/>
    <!-- 内容块 -->
    <rect x="24" y="16" width="50" height="4" rx="1" fill="hsl(var(--primary))" fill-opacity="0.3"/>
    <rect x="24" y="24" width="50" height="8" rx="1" fill="var(--background)"/>
    <rect x="24" y="36" width="24" height="8" rx="1" fill="var(--background)"/>
    <rect x="52" y="36" width="22" height="8" rx="1" fill="var(--background)"/>
  </svg>`,

  // 定宽/紧凑模式 - 内容居中有边距
  compact: `<svg viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="50" rx="3" fill="var(--muted)"/>
    <!-- 侧边栏 -->
    <rect x="0" y="0" width="18" height="50" rx="3" fill="var(--muted-foreground)" fill-opacity="0.2"/>
    <!-- Logo -->
    <rect x="5" y="4" width="8" height="4" rx="1" fill="var(--muted-foreground)" fill-opacity="0.4"/>
    <!-- 菜单项 -->
    <rect x="3" y="14" width="12" height="2" rx="1" fill="var(--muted-foreground)" fill-opacity="0.2"/>
    <rect x="3" y="20" width="12" height="2" rx="1" fill="var(--muted-foreground)" fill-opacity="0.3"/>
    <rect x="3" y="26" width="12" height="2" rx="1" fill="var(--muted-foreground)" fill-opacity="0.2"/>
    <!-- 顶栏 -->
    <rect x="20" y="2" width="58" height="8" rx="2" fill="var(--background)"/>
    <!-- 左边距 -->
    <rect x="20" y="12" width="8" height="36" fill="var(--muted)" fill-opacity="0.3"/>
    <!-- 内容区 (窄/居中) -->
    <rect x="28" y="12" width="42" height="36" rx="2" fill="var(--background)"/>
    <!-- 右边距 -->
    <rect x="70" y="12" width="8" height="36" fill="var(--muted)" fill-opacity="0.3"/>
    <!-- 内容块 -->
    <rect x="32" y="16" width="34" height="4" rx="1" fill="var(--muted-foreground)" fill-opacity="0.15"/>
    <rect x="32" y="24" width="34" height="8" rx="1" fill="var(--muted)" fill-opacity="0.5"/>
    <rect x="32" y="36" width="16" height="8" rx="1" fill="var(--muted)" fill-opacity="0.5"/>
    <rect x="50" y="36" width="16" height="8" rx="1" fill="var(--muted)" fill-opacity="0.5"/>
  </svg>`,
};

/**
 * 获取内容宽度图标
 * @param type - 内容宽度类型
 * @returns SVG 字符串
 */
export function getContentWidthIcon(type: ContentWidthType): string {
  return contentWidthIcons[type] ?? contentWidthIcons.wide;
}
