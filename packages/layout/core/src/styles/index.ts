/**
 * Tailwind CSS v4 样式系统
 * @description 提供布局相关的 CSS 变量、主题令牌和工具类
 */

import { CSS_VAR_NAMES } from '../constants';

/**
 * 布局 CSS 变量定义（用于 Tailwind CSS v4 @theme）
 */
export const layoutThemeTokens = {
  // 尺寸变量
  '--layout-header-height': '48px',
  '--layout-sidebar-width': '210px',
  '--layout-sidebar-collapse-width': '60px',
  '--layout-sidebar-mixed-width': '80px',
  '--layout-tabbar-height': '38px',
  '--layout-footer-height': '32px',
  '--layout-panel-width': '280px',
  '--layout-panel-collapse-width': '0px',
  '--layout-content-padding': '16px',
  '--layout-content-padding-top': '16px',
  '--layout-content-padding-bottom': '16px',
  '--layout-content-padding-left': '16px',
  '--layout-content-padding-right': '16px',
  '--layout-content-compact-width': '1200px',

  // z-index
  '--layout-z-index': '200',
  '--layout-z-index-header': '210',
  '--layout-z-index-sidebar': '220',
  '--layout-z-index-tabbar': '205',
  '--layout-z-index-panel': '215',
  '--layout-z-index-overlay': '250',

  // 动画时长
  '--layout-transition-fast': '150ms',
  '--layout-transition-normal': '200ms',
  '--layout-transition-slow': '300ms',
} as const;

/**
 * Tailwind CSS v4 @theme 配置字符串
 * @description 可直接用于 CSS 文件的 @theme 块
 */
export const tailwindThemeCSS = `
@theme {
  /* 布局尺寸 */
  --spacing-header: var(--layout-header-height, 48px);
  --spacing-sidebar: var(--layout-sidebar-width, 210px);
  --spacing-sidebar-collapsed: var(--layout-sidebar-collapse-width, 60px);
  --spacing-sidebar-mixed: var(--layout-sidebar-mixed-width, 80px);
  --spacing-tabbar: var(--layout-tabbar-height, 38px);
  --spacing-footer: var(--layout-footer-height, 32px);
  --spacing-panel: var(--layout-panel-width, 280px);
  --spacing-content-compact: var(--layout-content-compact-width, 1200px);

  /* z-index */
  --z-layout: var(--layout-z-index, 200);
  --z-layout-header: var(--layout-z-index-header, 210);
  --z-layout-sidebar: var(--layout-z-index-sidebar, 220);
  --z-layout-tabbar: var(--layout-z-index-tabbar, 205);
  --z-layout-panel: var(--layout-z-index-panel, 215);
  --z-layout-overlay: var(--layout-z-index-overlay, 250);

  /* 动画时长 */
  --duration-layout-fast: var(--layout-transition-fast, 150ms);
  --duration-layout-normal: var(--layout-transition-normal, 200ms);
  --duration-layout-slow: var(--layout-transition-slow, 300ms);

  /* 动画曲线 */
  --ease-layout: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-layout-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-layout-out: cubic-bezier(0, 0, 0.2, 1);
}
`;

/**
 * 布局基础样式 CSS
 */
export const layoutBaseCSS = `
/* 布局容器 */
.layout-container {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
}

/* 顶栏 */
.layout-header {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: var(--layout-z-index-header);
  height: var(--layout-header-height);
  transition: all var(--layout-transition-normal) var(--ease-layout);
}

.layout-header--with-sidebar {
  left: var(--layout-sidebar-width);
}

.layout-header--collapsed {
  left: var(--layout-sidebar-collapse-width);
}

.layout-header--hidden {
  transform: translateY(-100%);
}

/* 侧边栏 */
.layout-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: var(--layout-z-index-sidebar);
  width: var(--layout-sidebar-width);
  transition: width var(--layout-transition-normal) var(--ease-layout);
}

.layout-sidebar--collapsed {
  width: var(--layout-sidebar-collapse-width);
}

.layout-sidebar--mixed {
  width: var(--layout-sidebar-mixed-width);
}

.layout-sidebar--hidden {
  transform: translateX(-100%);
}

/* 标签栏 */
.layout-tabbar {
  position: fixed;
  top: var(--layout-header-height);
  right: 0;
  left: 0;
  z-index: var(--layout-z-index-tabbar);
  height: var(--layout-tabbar-height);
  transition: all var(--layout-transition-normal) var(--ease-layout);
}

.layout-tabbar--with-sidebar {
  left: var(--layout-sidebar-width);
}

.layout-tabbar--collapsed {
  left: var(--layout-sidebar-collapse-width);
}

/* 内容区 */
.layout-content {
  position: relative;
  min-height: calc(100vh - var(--layout-header-height) - var(--layout-tabbar-height));
  min-height: calc(100dvh - var(--layout-header-height) - var(--layout-tabbar-height));
  margin-left: var(--layout-sidebar-width);
  margin-top: calc(var(--layout-header-height) + var(--layout-tabbar-height));
  padding: var(--layout-content-padding);
  transition: margin var(--layout-transition-normal) var(--ease-layout);
}

.layout-content--collapsed {
  margin-left: var(--layout-sidebar-collapse-width);
}

.layout-content--compact {
  max-width: var(--layout-content-compact-width);
  margin-left: auto;
  margin-right: auto;
}

.layout-content--with-panel {
  margin-right: var(--layout-panel-width);
}

/* 页脚 */
.layout-footer {
  position: relative;
  height: var(--layout-footer-height);
  margin-left: var(--layout-sidebar-width);
  transition: margin var(--layout-transition-normal) var(--ease-layout);
}

.layout-footer--fixed {
  position: fixed;
  bottom: 0;
  right: 0;
  left: var(--layout-sidebar-width);
  z-index: var(--layout-z-index);
}

.layout-footer--collapsed {
  margin-left: var(--layout-sidebar-collapse-width);
  left: var(--layout-sidebar-collapse-width);
}

/* 功能区 */
.layout-panel {
  position: fixed;
  top: var(--layout-header-height);
  bottom: 0;
  z-index: var(--layout-z-index-panel);
  width: var(--layout-panel-width);
  transition: width var(--layout-transition-normal) var(--ease-layout);
}

.layout-panel--left {
  left: 0;
}

.layout-panel--right {
  right: 0;
}

.layout-panel--collapsed {
  width: var(--layout-panel-collapse-width);
}

/* 遮罩层 */
.layout-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--layout-z-index-overlay);
  background-color: rgb(0 0 0 / 45%);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--layout-transition-normal) var(--ease-layout);
}

.layout-overlay--visible {
  opacity: 1;
  pointer-events: auto;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .layout-sidebar {
    transform: translateX(-100%);
  }

  .layout-sidebar--mobile-visible {
    transform: translateX(0);
  }

  .layout-header--with-sidebar,
  .layout-tabbar--with-sidebar,
  .layout-content,
  .layout-footer {
    left: 0;
    margin-left: 0;
  }
}
`;

/**
 * Tailwind CSS v4 工具类扩展
 */
export const layoutUtilitiesCSS = `
/* 布局工具类 */
@utility h-header {
  height: var(--layout-header-height);
}

@utility w-sidebar {
  width: var(--layout-sidebar-width);
}

@utility w-sidebar-collapsed {
  width: var(--layout-sidebar-collapse-width);
}

@utility w-sidebar-mixed {
  width: var(--layout-sidebar-mixed-width);
}

@utility h-tabbar {
  height: var(--layout-tabbar-height);
}

@utility h-footer {
  height: var(--layout-footer-height);
}

@utility w-panel {
  width: var(--layout-panel-width);
}

@utility top-header {
  top: var(--layout-header-height);
}

@utility left-sidebar {
  left: var(--layout-sidebar-width);
}

@utility left-sidebar-collapsed {
  left: var(--layout-sidebar-collapse-width);
}

@utility z-layout {
  z-index: var(--layout-z-index);
}

@utility z-layout-header {
  z-index: var(--layout-z-index-header);
}

@utility z-layout-sidebar {
  z-index: var(--layout-z-index-sidebar);
}

@utility z-layout-tabbar {
  z-index: var(--layout-z-index-tabbar);
}

@utility z-layout-panel {
  z-index: var(--layout-z-index-panel);
}

@utility z-layout-overlay {
  z-index: var(--layout-z-index-overlay);
}

@utility duration-layout-fast {
  transition-duration: var(--layout-transition-fast);
}

@utility duration-layout-normal {
  transition-duration: var(--layout-transition-normal);
}

@utility duration-layout-slow {
  transition-duration: var(--layout-transition-slow);
}

@utility ease-layout {
  transition-timing-function: var(--ease-layout);
}

@utility transition-layout {
  transition-property: width, height, margin, padding, transform, opacity;
  transition-duration: var(--layout-transition-normal);
  transition-timing-function: var(--ease-layout);
}

/* 内容区内边距工具类 */
@utility p-content {
  padding: var(--layout-content-padding);
}

@utility pt-content {
  padding-top: var(--layout-content-padding-top);
}

@utility pb-content {
  padding-bottom: var(--layout-content-padding-bottom);
}

@utility pl-content {
  padding-left: var(--layout-content-padding-left);
}

@utility pr-content {
  padding-right: var(--layout-content-padding-right);
}

/* 滚动容器 */
@utility scrollbar-thin {
  scrollbar-width: thin;
}

@utility scrollbar-none {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

@utility scrollbar-none::-webkit-scrollbar {
  display: none;
}
`;

/**
 * 完整的布局样式 CSS
 */
export const layoutFullCSS = `
${tailwindThemeCSS}
${layoutBaseCSS}
${layoutUtilitiesCSS}
`;

/**
 * 导出 CSS 变量名常量
 */
export { CSS_VAR_NAMES };
