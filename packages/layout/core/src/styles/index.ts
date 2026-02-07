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
  '--admin-header-height': '48px',
  '--admin-sidebar-width': '210px',
  '--admin-sidebar-collapsed-width': '60px',
  '--layout-sidebar-mixed-width': '80px',
  '--admin-tabbar-height': '38px',
  '--admin-footer-height': '32px',
  '--layout-panel-width': '280px',
  '--layout-panel-collapse-width': '0px',
  '--admin-content-padding': '16px',
  '--admin-content-padding-top': '16px',
  '--admin-content-padding-bottom': '16px',
  '--admin-content-padding-left': '16px',
  '--admin-content-padding-right': '16px',
  '--layout-content-compact-width': '1200px',

  // z-index
  '--layout-z-index': '200',
  '--layout-z-index-header': '210',
  '--layout-z-index-sidebar': '220',
  '--layout-z-index-tabbar': '205',
  '--layout-z-index-panel': '215',
  '--layout-z-index-overlay': '250',

} as const;

/**
 * Tailwind CSS v4 @theme 配置字符串
 * @description 可直接用于 CSS 文件的 @theme 块
 */
export const tailwindThemeCSS = `
@theme {
  /* 布局尺寸 */
  --spacing-header: var(--admin-header-height, 48px);
  --spacing-sidebar: var(--admin-sidebar-width, 210px);
  --spacing-sidebar-collapsed: var(--admin-sidebar-collapsed-width, 60px);
  --spacing-sidebar-mixed: var(--layout-sidebar-mixed-width, 80px);
  --spacing-tabbar: var(--admin-tabbar-height, 38px);
  --spacing-footer: var(--admin-footer-height, 32px);
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
  --duration-layout-fast: var(--admin-duration-fast, 150ms);
  --duration-layout-normal: var(--admin-duration-normal, 300ms);
  --duration-layout-slow: var(--admin-duration-slow, 500ms);

  /* 动画曲线 */
  --ease-layout: var(--admin-easing-default, cubic-bezier(0.4, 0, 0.2, 1));
  --ease-layout-in: var(--admin-easing-in, cubic-bezier(0.4, 0, 1, 1));
  --ease-layout-out: var(--admin-easing-out, cubic-bezier(0, 0, 0.2, 1));
}
`;

/**
 * 布局基础样式 CSS
 */
export const layoutBaseCSS = `
/* 主题切换过渡（View Transitions） */
@supports (view-transition-name: root) {
  :root {
    view-transition-name: root;
  }

  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation: none;
    mix-blend-mode: normal;
  }

  :root.dark::view-transition-old(root) {
    z-index: 1;
  }

  :root.dark::view-transition-new(root) {
    z-index: 9999;
  }

  :root:not(.dark)::view-transition-old(root) {
    z-index: 9999;
  }

  :root:not(.dark)::view-transition-new(root) {
    z-index: 1;
  }
}

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
  height: var(--admin-header-height);
  transition: all var(--admin-duration-normal, 300ms)
    var(--admin-easing-default, cubic-bezier(0.4, 0, 0.2, 1));
}

:is(.layout-header--with-sidebar, .layout-header[data-with-sidebar="true"]) {
  left: var(--admin-sidebar-width);
}

:is(.layout-header--collapsed, .layout-header[data-collapsed="true"]) {
  left: var(--admin-sidebar-collapsed-width);
}

:is(.layout-header--hidden, .layout-header[data-hidden="true"]) {
  transform: translateY(-100%);
}

/* 侧边栏 */
.layout-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: var(--layout-z-index-sidebar);
  width: var(--admin-sidebar-width);
  transition: width var(--admin-duration-normal, 300ms)
    var(--admin-easing-default, cubic-bezier(0.4, 0, 0.2, 1));
}

:is(.layout-sidebar--collapsed, .layout-sidebar[data-collapsed="true"]) {
  width: var(--admin-sidebar-collapsed-width);
}

:is(.layout-sidebar--mixed, .layout-sidebar[data-mixed="true"]) {
  width: var(--layout-sidebar-mixed-width);
}

:is(.layout-sidebar--hidden, .layout-sidebar[data-hidden="true"]) {
  transform: translateX(-100%);
}

/* 标签栏 */
.layout-tabbar {
  position: fixed;
  top: var(--admin-header-height);
  right: 0;
  left: 0;
  z-index: var(--layout-z-index-tabbar);
  height: var(--admin-tabbar-height);
  transition: all var(--admin-duration-normal, 300ms)
    var(--admin-easing-default, cubic-bezier(0.4, 0, 0.2, 1));
}

:is(.layout-tabbar--with-sidebar, .layout-tabbar[data-with-sidebar="true"]) {
  left: var(--admin-sidebar-width);
}

:is(.layout-tabbar--collapsed, .layout-tabbar[data-collapsed="true"]) {
  left: var(--admin-sidebar-collapsed-width);
}

/* 内容区 */
.layout-content {
  position: relative;
  min-height: calc(100vh - var(--admin-header-height) - var(--admin-tabbar-height));
  min-height: calc(100dvh - var(--admin-header-height) - var(--admin-tabbar-height));
  margin-left: var(--admin-sidebar-width);
  margin-top: calc(var(--admin-header-height) + var(--admin-tabbar-height));
  padding: var(--admin-content-padding);
  transition: margin var(--admin-duration-normal, 300ms)
    var(--admin-easing-default, cubic-bezier(0.4, 0, 0.2, 1));
}

:is(.layout-content--collapsed, .layout-content[data-collapsed="true"]) {
  margin-left: var(--admin-sidebar-collapsed-width);
}

:is(.layout-content--compact, .layout-content[data-compact="true"]) {
  max-width: var(--layout-content-compact-width);
  margin-left: auto;
  margin-right: auto;
}

:is(.layout-content--with-panel, .layout-content[data-with-panel="true"]) {
  margin-right: var(--layout-panel-width);
}

:is(.layout-content--mobile, .layout-content[data-mobile="true"]) {
  margin-left: 0;
  margin-right: 0;
}

:is(.layout-content--panel-left, .layout-content[data-panel-position="left"]) {
  margin-left: calc(var(--admin-sidebar-width) + var(--layout-panel-width));
}

:is(.layout-content--panel-right, .layout-content[data-panel-position="right"]) {
  margin-right: var(--layout-panel-width);
}

:is(.layout-content--panel-collapsed, .layout-content[data-panel-collapsed="true"]) {
  margin-right: 0;
}

/* 页脚 */
.layout-footer {
  position: relative;
  height: var(--admin-footer-height);
  margin-left: var(--admin-sidebar-width);
  transition: margin var(--admin-duration-normal, 300ms)
    var(--admin-easing-default, cubic-bezier(0.4, 0, 0.2, 1));
}

:is(.layout-footer--with-sidebar, .layout-footer[data-with-sidebar="true"]) {
  margin-left: var(--admin-sidebar-width);
}

:is(.layout-footer--fixed, .layout-footer[data-fixed="true"]) {
  position: fixed;
  bottom: 0;
  right: 0;
  left: var(--admin-sidebar-width);
  z-index: var(--layout-z-index);
}

:is(.layout-footer--collapsed, .layout-footer--sidebar-collapsed, .layout-footer[data-collapsed="true"]) {
  margin-left: var(--admin-sidebar-collapsed-width);
  left: var(--admin-sidebar-collapsed-width);
}

/* 功能区 */
.layout-panel {
  position: fixed;
  top: var(--admin-header-height);
  bottom: 0;
  z-index: var(--layout-z-index-panel);
  width: var(--layout-panel-width);
  transition: width var(--admin-duration-normal, 300ms)
    var(--admin-easing-default, cubic-bezier(0.4, 0, 0.2, 1));
}

:is(.layout-panel--left, .layout-panel[data-position="left"]) {
  left: 0;
}

:is(.layout-panel--right, .layout-panel[data-position="right"]) {
  right: 0;
}

:is(.layout-panel--collapsed, .layout-panel[data-collapsed="true"]) {
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
  transition: opacity var(--admin-duration-normal, 300ms)
    var(--admin-easing-default, cubic-bezier(0.4, 0, 0.2, 1));
}

:is(.layout-overlay--visible, .layout-overlay[data-state="visible"]) {
  opacity: 1;
  pointer-events: auto;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .layout-sidebar {
    transform: translateX(-100%);
  }

  :is(.layout-sidebar--mobile-visible, .layout-sidebar[data-mobile-visible="true"]) {
    transform: translateX(0);
  }

  :is(.layout-header--with-sidebar, .layout-header[data-with-sidebar="true"]),
  :is(.layout-tabbar--with-sidebar, .layout-tabbar[data-with-sidebar="true"]),
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
  height: var(--admin-header-height);
}

@utility w-sidebar {
  width: var(--admin-sidebar-width);
}

@utility w-sidebar-collapsed {
  width: var(--admin-sidebar-collapsed-width);
}

@utility w-sidebar-mixed {
  width: var(--layout-sidebar-mixed-width);
}

@utility h-tabbar {
  height: var(--admin-tabbar-height);
}

@utility h-footer {
  height: var(--admin-footer-height);
}

@utility w-panel {
  width: var(--layout-panel-width);
}

@utility top-header {
  top: var(--admin-header-height);
}

@utility left-sidebar {
  left: var(--admin-sidebar-width);
}

@utility left-sidebar-collapsed {
  left: var(--admin-sidebar-collapsed-width);
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
  transition-duration: var(--admin-duration-fast, 150ms);
}

@utility duration-layout-normal {
  transition-duration: var(--admin-duration-normal, 300ms);
}

@utility duration-layout-slow {
  transition-duration: var(--admin-duration-slow, 500ms);
}

@utility ease-layout {
  transition-timing-function: var(--admin-easing-default, cubic-bezier(0.4, 0, 0.2, 1));
}

@utility transition-layout {
  transition-property: width, height, margin, padding, transform, opacity;
  transition-duration: var(--admin-duration-normal, 300ms);
  transition-timing-function: var(--admin-easing-default, cubic-bezier(0.4, 0, 0.2, 1));
}

/* 内容区内边距工具类 */
@utility p-content {
  padding: var(--admin-content-padding);
}

@utility pt-content {
  padding-top: var(--admin-content-padding-top);
}

@utility pb-content {
  padding-bottom: var(--admin-content-padding-bottom);
}

@utility pl-content {
  padding-left: var(--admin-content-padding-left);
}

@utility pr-content {
  padding-right: var(--admin-content-padding-right);
}

/* 滚动容器 */
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
