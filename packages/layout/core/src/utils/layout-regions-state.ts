/**
 * 布局区域状态公共纯函数
 * @description 提供 React/Vue 共用的 sidebar/header/panel/responsive 业务逻辑
 */

import { BREAKPOINTS, HEADER_TRIGGER_DISTANCE } from '../constants';
import type { BasicLayoutProps, LayoutComputed } from '../types';

export type HeaderMode = 'fixed' | 'static' | 'auto' | 'auto-scroll';
export type ResponsiveBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export function isSidebarNonCollapsible(computed: Pick<LayoutComputed, 'isSidebarMixedNav' | 'isHeaderMixedNav'>): boolean {
  return computed.isSidebarMixedNav || computed.isHeaderMixedNav;
}

export function resolveSidebarCollapsedValue(options: {
  isNonCollapsible: boolean;
  sidebarCollapsed: boolean;
}): boolean {
  return options.isNonCollapsible ? false : options.sidebarCollapsed;
}

export function resolveNextSidebarCollapsed(options: {
  isNonCollapsible: boolean;
  currentCollapsed: boolean;
  requestedCollapsed: boolean;
}): { nextCollapsed: boolean; changed: boolean } {
  const nextCollapsed = options.isNonCollapsible ? false : options.requestedCollapsed;
  return {
    nextCollapsed,
    changed: options.currentCollapsed !== nextCollapsed,
  };
}

export function resolveSidebarToggleCollapsed(options: {
  isNonCollapsible: boolean;
  currentCollapsed: boolean;
}): boolean {
  if (options.isNonCollapsible) return options.currentCollapsed;
  return !options.currentCollapsed;
}

export function resolveSidebarMouseEnterEffects(options: {
  expandOnHover: boolean;
  collapsed: boolean;
}): { expandOnHovering?: boolean } {
  if (options.expandOnHover && options.collapsed) {
    return { expandOnHovering: true };
  }
  return {};
}

export function resolveSidebarMouseLeaveEffects(options: {
  expandOnHovering: boolean;
  expandOnHover: boolean;
}): { expandOnHovering?: boolean; extraVisible?: boolean } {
  const patch: { expandOnHovering?: boolean; extraVisible?: boolean } = {};
  if (options.expandOnHovering) {
    patch.expandOnHovering = false;
  }
  if (options.expandOnHover) {
    patch.extraVisible = false;
  }
  return patch;
}

export function resolveHeaderMode(mode: unknown): HeaderMode {
  return mode === 'auto' || mode === 'auto-scroll' || mode === 'static' ? mode : 'fixed';
}

export function isHeaderAutoHideMode(mode: HeaderMode): boolean {
  return mode === 'auto' || mode === 'auto-scroll';
}

export function resolveHeaderHidden(options: {
  stateHidden: boolean;
  configHidden: boolean;
}): boolean {
  return options.stateHidden || options.configHidden;
}

export function resolveHeaderMouseHidden(options: {
  mouseY: number;
  currentHidden: boolean;
  triggerDistance?: number;
}): boolean {
  const triggerDistance = options.triggerDistance ?? HEADER_TRIGGER_DISTANCE;
  const hideThreshold = triggerDistance;
  const showThreshold = Math.max(0, triggerDistance - 20);

  if (options.mouseY > hideThreshold && !options.currentHidden) {
    return true;
  }
  if (options.mouseY < showThreshold && options.currentHidden) {
    return false;
  }
  return options.currentHidden;
}

export function resolveHeaderScrollHidden(options: {
  mode: HeaderMode;
  currentHidden: boolean;
  currentScrollY: number;
  lastScrollY: number;
  headerHeight: number;
  mouseY: number;
  triggerDistance?: number;
}): { hidden: boolean; lastScrollY: number } {
  if (options.mode === 'auto') {
    return {
      hidden: resolveHeaderMouseHidden({
        mouseY: options.mouseY,
        currentHidden: options.currentHidden,
        triggerDistance: options.triggerDistance,
      }),
      lastScrollY: options.currentScrollY,
    };
  }
  if (options.mode === 'auto-scroll') {
    if (options.currentScrollY > options.lastScrollY && options.currentScrollY > options.headerHeight) {
      return { hidden: true, lastScrollY: options.currentScrollY };
    }
    if (options.currentScrollY < options.lastScrollY) {
      return { hidden: false, lastScrollY: options.currentScrollY };
    }
  }
  return { hidden: options.currentHidden, lastScrollY: options.currentScrollY };
}

export function resolvePanelPosition(panel: BasicLayoutProps['panel'] | undefined): string {
  return panel?.position || 'right';
}

export function resolveNextPanelCollapsed(currentCollapsed: boolean, requestedCollapsed: boolean): {
  nextCollapsed: boolean;
  changed: boolean;
} {
  return {
    nextCollapsed: requestedCollapsed,
    changed: currentCollapsed !== requestedCollapsed,
  };
}

export function resolveResponsiveFlags(width: number): {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
} {
  return {
    isMobile: width < BREAKPOINTS.md,
    isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isDesktop: width >= BREAKPOINTS.lg,
  };
}

export function resolveResponsiveBreakpoint(width: number): ResponsiveBreakpoint {
  if (width < BREAKPOINTS.sm) return 'xs';
  if (width < BREAKPOINTS.md) return 'sm';
  if (width < BREAKPOINTS.lg) return 'md';
  if (width < BREAKPOINTS.xl) return 'lg';
  if (width < BREAKPOINTS['2xl']) return 'xl';
  return '2xl';
}

export function resolveViewportWidthChange(currentWidth: number, nextWidth: number): {
  width: number;
  changed: boolean;
} {
  return {
    width: nextWidth,
    changed: currentWidth !== nextWidth,
  };
}
