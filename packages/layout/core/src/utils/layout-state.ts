/**
 * 布局状态公共纯函数
 * @description 提供 React/Vue 共用的派生计算，避免重复实现
 */

import type { BasicLayoutProps } from '../types';

export const PAGE_TRANSITION_NAMES = [
  'fade',
  'fade-slide',
  'fade-up',
  'fade-down',
  'slide-left',
  'slide-right',
] as const;

export type PageTransitionName = (typeof PAGE_TRANSITION_NAMES)[number];

const PAGE_TRANSITION_SET = new Set<PageTransitionName>(PAGE_TRANSITION_NAMES);

/**
 * 规范化页面过渡动画名称
 */
export function resolvePageTransitionName(
  name: unknown,
  fallback: PageTransitionName = 'fade-slide'
): PageTransitionName {
  if (typeof name !== 'string') return fallback;
  return PAGE_TRANSITION_SET.has(name as PageTransitionName)
    ? (name as PageTransitionName)
    : fallback;
}

export interface LayoutPreferencesSnapshot {
  mergedProps: BasicLayoutProps;
  layoutType: NonNullable<BasicLayoutProps['layout']>;
  themeMode: string;
  isDark: boolean;
  sidebarConfig: NonNullable<BasicLayoutProps['sidebar']>;
  headerConfig: NonNullable<BasicLayoutProps['header']>;
  tabbarConfig: NonNullable<BasicLayoutProps['tabbar']>;
  footerConfig: NonNullable<BasicLayoutProps['footer']>;
}

/**
 * 生成布局偏好派生快照
 */
export function buildLayoutPreferencesSnapshot(
  preferencesProps: Partial<BasicLayoutProps>,
  userProps: BasicLayoutProps
): LayoutPreferencesSnapshot {
  const mergedProps: BasicLayoutProps = {
    ...preferencesProps,
    ...userProps,
  };

  const layoutType = mergedProps.layout || 'sidebar-nav';
  const themeMode = mergedProps.theme?.mode || 'light';
  const isDark = themeMode === 'dark';

  const sidebarConfig = {
    width: mergedProps.sidebar?.width,
    collapsedWidth: mergedProps.sidebar?.collapseWidth,
    hidden: mergedProps.sidebar?.hidden,
    ...mergedProps.sidebar,
  };

  const headerConfig = {
    height: mergedProps.header?.height,
    hidden: mergedProps.header?.hidden,
    ...mergedProps.header,
  };

  const tabbarConfig = {
    enable: mergedProps.tabbar?.enable,
    height: mergedProps.tabbar?.height,
    draggable: mergedProps.tabbar?.draggable,
    wheelable: mergedProps.tabbar?.wheelable,
    showMaximize: mergedProps.tabbar?.showMaximize,
    middleClickToClose: mergedProps.tabbar?.middleClickToClose,
    ...mergedProps.tabbar,
  };

  const footerConfig = {
    enable: mergedProps.footer?.enable,
    fixed: mergedProps.footer?.fixed,
    ...mergedProps.footer,
  };

  return {
    mergedProps,
    layoutType,
    themeMode,
    isDark,
    sidebarConfig,
    headerConfig,
    tabbarConfig,
    footerConfig,
  };
}
