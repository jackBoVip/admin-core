/**
 * 布局图标
 * @description SVG 图标字符串，供 Vue/React 包装使用
 * @reference Vben Admin 风格的布局预览图标
 */

import type { LayoutType } from '../types';

/**
 * 布局图标 SVG
 * @description 用于布局选择器显示，与 Vben Admin 保持一致
 * viewBox: 104x66 (Vben Admin 标准尺寸)
 */
export const layoutIcons: Record<LayoutType, string> = {
  // 侧边导航 (sidebar-nav)
  'sidebar-nav': `<svg viewBox="0 0 104 66" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g>
      <!-- 背景 -->
      <rect fill="currentColor" fill-opacity="0.02" height="66" rx="4" width="104"/>
      <!-- 侧边栏 (主题色) -->
      <path d="M0,4 C0,1.79 1.79,0 4,0 L27,0 L27,66 L4,66 C1.79,66 0,64.21 0,62 L0,4 Z" fill="hsl(var(--primary))"/>
      <!-- 侧边栏 Logo -->
      <rect fill="#ffffff" height="9" rx="2" width="10" x="9" y="6"/>
      <!-- 侧边栏菜单项 -->
      <rect fill="#e5e5e5" height="3" rx="1.5" width="18" x="5" y="24"/>
      <rect fill="#ffffff" height="3" rx="1.5" width="18" x="5" y="35"/>
      <rect fill="#ffffff" height="3" rx="1.5" width="18" x="5" y="45"/>
      <rect fill="#ffffff" height="3" rx="1.5" width="18" x="5" y="55"/>
      <!-- 顶栏 -->
      <rect fill="currentColor" fill-opacity="0.08" height="9" rx="2" width="74" x="29" y="1"/>
      <!-- 顶栏工具栏 -->
      <rect fill="#b2b2b2" height="4" rx="1" width="4" x="32" y="4"/>
      <rect fill="#b2b2b2" height="4" rx="1" width="4" x="81" y="4"/>
      <rect fill="#b2b2b2" height="4" rx="1" width="4" x="88" y="4"/>
      <rect fill="#b2b2b2" height="4" rx="1" width="4" x="95" y="4"/>
      <!-- 内容区块 -->
      <rect fill="currentColor" fill-opacity="0.08" height="22" rx="2" width="23" x="29" y="15"/>
      <rect fill="currentColor" fill-opacity="0.08" height="22" rx="2" width="46" x="56" y="15"/>
      <rect fill="currentColor" fill-opacity="0.08" height="22" rx="2" width="73" x="29" y="40"/>
    </g>
  </svg>`,

  // 侧边混合导航 (sidebar-mixed-nav)
  'sidebar-mixed-nav': `<svg viewBox="0 0 104 66" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g>
      <!-- 背景 -->
      <rect fill="currentColor" fill-opacity="0.02" height="66" rx="4" width="104"/>
      <!-- 一级侧边栏 (主题色，窄) -->
      <path d="M0,4 C0,1.79 1.79,0 4,0 L10,0 L10,66 L4,66 C1.79,66 0,64.21 0,62 L0,4 Z" fill="hsl(var(--primary))"/>
      <!-- 一级侧边栏 Logo -->
      <rect fill="#ffffff" height="8" rx="2" width="8" x="1" y="1"/>
      <!-- 一级侧边栏菜单项 -->
      <rect fill="#e5e5e5" height="3" rx="1.5" width="6" x="2" y="15"/>
      <rect fill="#e5e5e5" height="3" rx="1.5" width="6" x="2" y="28"/>
      <rect fill="#e5e5e5" height="3" rx="1.5" width="6" x="2" y="42"/>
      <rect fill="#e5e5e5" height="3" rx="1.5" width="6" x="2" y="55"/>
      <!-- 二级侧边栏 -->
      <rect fill="currentColor" fill-opacity="0.08" height="66" width="13" x="10" y="0"/>
      <!-- 顶栏 -->
      <rect fill="currentColor" fill-opacity="0.08" height="9" rx="2" width="76" x="26" y="1"/>
      <!-- 顶栏工具栏 -->
      <rect fill="#b2b2b2" height="4" rx="1" width="4" x="28" y="4"/>
      <rect fill="#b2b2b2" height="4" rx="1" width="4" x="81" y="4"/>
      <rect fill="#b2b2b2" height="4" rx="1" width="4" x="88" y="4"/>
      <rect fill="#b2b2b2" height="4" rx="1" width="4" x="95" y="4"/>
      <!-- 内容区块 -->
      <rect fill="currentColor" fill-opacity="0.08" height="21" rx="2" width="29" x="26" y="15"/>
      <rect fill="currentColor" fill-opacity="0.08" height="21" rx="2" width="43" x="58" y="15"/>
      <rect fill="currentColor" fill-opacity="0.08" height="22" rx="2" width="75" x="26" y="40"/>
    </g>
  </svg>`,

  // 顶部导航 (header-nav)
  'header-nav': `<svg viewBox="0 0 104 66" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g>
      <!-- 背景 -->
      <rect fill="currentColor" fill-opacity="0.02" height="66" rx="4" width="104"/>
      <!-- 顶栏 (主题色) -->
      <rect fill="hsl(var(--primary))" height="9" width="104" x="0" y="0"/>
      <!-- 顶栏 Logo -->
      <rect fill="#ffffff" height="7" rx="2" width="8" x="2" y="1"/>
      <!-- 顶栏菜单项 -->
      <rect fill="#e5e5e5" height="3" rx="1.5" width="8" x="16" y="3"/>
      <rect fill="#e5e5e5" height="3" rx="1.5" width="8" x="28" y="3"/>
      <rect fill="#e5e5e5" height="3" rx="1.5" width="8" x="41" y="3"/>
      <rect fill="#e5e5e5" height="3" rx="1.5" width="8" x="54" y="3"/>
      <!-- 顶栏工具栏 -->
      <path d="M98,2.87 C98,2.33 98.46,1.87 99,1.87 L101,1.87 C101.54,1.87 102,2.33 102,2.87 L102,5.27 C102,5.81 101.54,6.27 101,6.27 L99,6.27 C98.46,6.27 98,5.81 98,5.27 L98,2.87 Z" fill="#ffffff"/>
      <!-- 内容区块 -->
      <rect fill="currentColor" fill-opacity="0.08" height="21" rx="2" width="35" x="3" y="14"/>
      <rect fill="currentColor" fill-opacity="0.08" height="21" rx="2" width="54" x="43" y="14"/>
      <rect fill="currentColor" fill-opacity="0.08" height="22" rx="2" width="95" x="3" y="39"/>
    </g>
  </svg>`,

  // 顶部通栏+侧边导航 (header-sidebar-nav)
  'header-sidebar-nav': `<svg viewBox="0 0 104 66" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g>
      <!-- 背景 -->
      <rect fill="currentColor" fill-opacity="0.02" height="66" rx="4" width="104"/>
      <!-- 顶栏 -->
      <rect fill="currentColor" fill-opacity="0.08" height="9" width="104" x="0" y="0"/>
      <!-- 顶栏 Logo -->
      <rect fill="#ffffff" height="5" rx="2" width="6" x="2" y="1"/>
      <!-- 顶栏菜单项 -->
      <rect fill="#b2b2b2" height="2" rx="1" width="7" x="10" y="4"/>
      <rect fill="#e5e5e5" height="3" rx="1.5" width="8" x="28" y="3"/>
      <rect fill="#e5e5e5" height="3" rx="1.5" width="8" x="41" y="3"/>
      <rect fill="#e5e5e5" height="3" rx="1.5" width="8" x="54" y="3"/>
      <!-- 顶栏工具栏 -->
      <rect fill="#b2b2b2" height="4" rx="1" width="4" x="81" y="3"/>
      <rect fill="#b2b2b2" height="4" rx="1" width="4" x="88" y="3"/>
      <path d="M98,2.87 C98,2.33 98.46,1.87 99,1.87 L101,1.87 C101.54,1.87 102,2.33 102,2.87 L102,5.27 C102,5.81 101.54,6.27 101,6.27 L99,6.27 C98.46,6.27 98,5.81 98,5.27 L98,2.87 Z" fill="#ffffff"/>
      <!-- 侧边栏 (主题色) -->
      <rect fill="hsl(var(--primary))" height="57" width="15" x="0" y="9"/>
      <!-- 侧边栏菜单项 -->
      <path d="M2,15 C2,14.8 2.27,14.6 0.6,14.6 L11,14.6 C11.3,14.6 11.6,14.8 11.6,15 L11.6,19 C11.6,19.2 11.3,19.4 11,19.4 L3,19.4 C2.7,19.4 2.4,19.2 2.4,19 L2.4,15.4 Z" fill="#fff"/>
      <path d="M2,28 C2,27.8 2.27,27.6 0.6,27.6 L11,27.6 C11.3,27.6 11.6,27.8 11.6,28 L11.6,32 C11.6,32.2 11.3,32.4 11,32.4 L3,32.4 C2.7,32.4 2.4,32.2 2.4,32 L2.4,28.4 Z" fill="#fff"/>
      <path d="M2,41 C2,40.8 2.27,40.6 0.6,40.6 L11,40.6 C11.3,40.6 11.6,40.8 11.6,41 L11.6,45 C11.6,45.2 11.3,45.4 11,45.4 L3,45.4 C2.7,45.4 2.4,45.2 2.4,45 L2.4,41.4 Z" fill="#fff"/>
      <path d="M2,54 C2,53.8 2.27,53.6 0.6,53.6 L11,53.6 C11.3,53.6 11.6,53.8 11.6,54 L11.6,58 C11.6,58.2 11.3,58.4 11,58.4 L3,58.4 C2.7,58.4 2.4,58.2 2.4,58 L2.4,54.4 Z" fill="#fff"/>
      <!-- 内容区块 -->
      <rect fill="currentColor" fill-opacity="0.08" height="21" rx="2" width="26" x="20" y="14"/>
      <rect fill="currentColor" fill-opacity="0.08" height="21" rx="2" width="44" x="53" y="14"/>
      <rect fill="currentColor" fill-opacity="0.08" height="22" rx="2" width="78" x="20" y="39"/>
    </g>
  </svg>`,

  // 混合导航 (mixed-nav)
  'mixed-nav': `<svg viewBox="0 0 104 66" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g>
      <!-- 背景 -->
      <rect fill="currentColor" fill-opacity="0.02" height="66" rx="4" width="104"/>
      <!-- 顶栏 (主题色) -->
      <rect fill="hsl(var(--primary))" height="9" width="104" x="0" y="0"/>
      <!-- 顶栏 Logo -->
      <rect fill="#ffffff" height="7" rx="2" width="8" x="2" y="1"/>
      <!-- 顶栏菜单项 -->
      <rect fill="#e5e5e5" height="3" rx="1.5" width="8" x="16" y="3"/>
      <rect fill="#e5e5e5" height="3" rx="1.5" width="8" x="28" y="3"/>
      <rect fill="#e5e5e5" height="3" rx="1.5" width="8" x="41" y="3"/>
      <rect fill="#e5e5e5" height="3" rx="1.5" width="8" x="54" y="3"/>
      <!-- 顶栏工具栏 -->
      <rect fill="#b2b2b2" height="4" rx="1" width="4" x="81" y="3"/>
      <rect fill="#b2b2b2" height="4" rx="1" width="4" x="88" y="3"/>
      <path d="M98,2.87 C98,2.33 98.46,1.87 99,1.87 L101,1.87 C101.54,1.87 102,2.33 102,2.87 L102,5.27 C102,5.81 101.54,6.27 101,6.27 L99,6.27 C98.46,6.27 98,5.81 98,5.27 L98,2.87 Z" fill="#ffffff"/>
      <!-- 二级侧边栏 -->
      <rect fill="currentColor" fill-opacity="0.08" height="57" width="20" x="0" y="9"/>
      <!-- 内容区块 -->
      <rect fill="currentColor" fill-opacity="0.08" height="21" rx="2" width="35" x="23" y="14"/>
      <rect fill="currentColor" fill-opacity="0.08" height="21" rx="2" width="38" x="63" y="14"/>
      <rect fill="currentColor" fill-opacity="0.08" height="22" rx="2" width="78" x="23" y="39"/>
    </g>
  </svg>`,

  // 顶部混合导航 (header-mixed-nav)
  'header-mixed-nav': `<svg viewBox="0 0 104 66" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g>
      <!-- 背景 -->
      <rect fill="currentColor" fill-opacity="0.02" height="66" rx="4" width="104"/>
      <!-- 顶栏 -->
      <rect fill="currentColor" fill-opacity="0.08" height="9" width="104" x="0" y="0"/>
      <!-- 顶栏 Logo -->
      <rect fill="#ffffff" height="5" rx="2" width="6" x="2" y="1"/>
      <!-- 顶栏菜单项 -->
      <rect fill="#b2b2b2" height="2" rx="1" width="7" x="10" y="4"/>
      <rect fill="#e5e5e5" height="3" rx="1.5" width="8" x="28" y="3"/>
      <rect fill="#e5e5e5" height="3" rx="1.5" width="8" x="41" y="3"/>
      <rect fill="#e5e5e5" height="3" rx="1.5" width="8" x="54" y="3"/>
      <!-- 顶栏工具栏 -->
      <rect fill="#b2b2b2" height="4" rx="1" width="4" x="81" y="3"/>
      <rect fill="#b2b2b2" height="4" rx="1" width="4" x="88" y="3"/>
      <path d="M98,2.87 C98,2.33 98.46,1.87 99,1.87 L101,1.87 C101.54,1.87 102,2.33 102,2.87 L102,5.27 C102,5.81 101.54,6.27 101,6.27 L99,6.27 C98.46,6.27 98,5.81 98,5.27 L98,2.87 Z" fill="#ffffff"/>
      <!-- 侧边栏 (主题色) -->
      <rect fill="hsl(var(--primary))" height="57" width="20" x="0" y="9"/>
      <!-- 侧边栏菜单项 -->
      <rect fill="#fff" height="4" rx="1" width="16" x="2" y="15"/>
      <rect fill="#fff" height="4" rx="1" width="16" x="2" y="25"/>
      <rect fill="#fff" height="4" rx="1" width="16" x="2" y="35"/>
      <rect fill="#fff" height="4" rx="1" width="16" x="2" y="45"/>
      <rect fill="#fff" height="4" rx="1" width="16" x="2" y="55"/>
      <!-- 内容区块 -->
      <rect fill="currentColor" fill-opacity="0.08" height="21" rx="2" width="35" x="23" y="14"/>
      <rect fill="currentColor" fill-opacity="0.08" height="21" rx="2" width="38" x="63" y="14"/>
      <rect fill="currentColor" fill-opacity="0.08" height="22" rx="2" width="78" x="23" y="39"/>
    </g>
  </svg>`,

  // 全屏内容 (full-content)
  'full-content': `<svg viewBox="0 0 104 66" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g>
      <!-- 背景 -->
      <rect fill="currentColor" fill-opacity="0.02" height="66" rx="4" width="104"/>
      <!-- 全屏内容区 -->
      <rect fill="currentColor" fill-opacity="0.08" height="62" rx="2" width="100" x="2" y="2"/>
    </g>
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
