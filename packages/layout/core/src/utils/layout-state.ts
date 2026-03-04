/**
 * 布局状态公共纯函数
 * @description 提供 React/Vue 共用的派生计算，避免重复实现
 */

import type { BasicLayoutProps } from '../types';

/** 页面过渡动画名称白名单。 */
export const PAGE_TRANSITION_NAMES = [
  'fade',
  'fade-slide',
  'fade-up',
  'fade-down',
  'slide-left',
  'slide-right',
] as const;

/**
 * 页面过渡动画名称类型。
 */
export type PageTransitionName = (typeof PAGE_TRANSITION_NAMES)[number];

const PAGE_TRANSITION_SET = new Set<PageTransitionName>(PAGE_TRANSITION_NAMES);

/**
 * 规范化页面过渡动画名称。
 * @param name 待规范化的动画名称。
 * @param fallback 回退动画名称。
 * @returns 白名单内的动画名称；非法值返回 `fallback`。
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

/**
 * 布局偏好合并后的派生快照。
 */
export interface LayoutPreferencesSnapshot {
  /** 用户配置与偏好配置合并后的最终 props。 */
  mergedProps: BasicLayoutProps;
  /** 当前布局类型。 */
  layoutType: NonNullable<BasicLayoutProps['layout']>;
  /** 当前主题模式字符串。 */
  themeMode: string;
  /** 是否为深色模式。 */
  isDark: boolean;
  /** 侧边栏配置快照。 */
  sidebarConfig: NonNullable<BasicLayoutProps['sidebar']>;
  /** 顶栏配置快照。 */
  headerConfig: NonNullable<BasicLayoutProps['header']>;
  /** 标签栏配置快照。 */
  tabbarConfig: NonNullable<BasicLayoutProps['tabbar']>;
  /** 页脚配置快照。 */
  footerConfig: NonNullable<BasicLayoutProps['footer']>;
}

/**
 * 生成布局偏好派生快照。
 * @param preferencesProps 偏好系统映射出的布局属性。
 * @param userProps 业务侧显式传入的布局属性。
 * @returns 合并后的布局偏好快照。
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
