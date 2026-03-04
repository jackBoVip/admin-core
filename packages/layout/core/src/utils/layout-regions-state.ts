/**
 * 布局区域状态公共纯函数
 * @description 提供 React/Vue 共用的 sidebar/header/panel/responsive 业务逻辑
 */

import { BREAKPOINTS, HEADER_TRIGGER_DISTANCE } from '../constants';
import type { BasicLayoutProps, LayoutComputed } from '../types';

/** 顶部栏模式。 */
export type HeaderMode = 'fixed' | 'static' | 'auto' | 'auto-scroll';
/** 响应式断点标识。 */
export type ResponsiveBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * 判断侧边栏是否不可折叠（混合导航场景）。
 * @param computed 计算状态切片。
 * @returns 是否不可折叠。
 */
export function isSidebarNonCollapsible(computed: Pick<LayoutComputed, 'isSidebarMixedNav' | 'isHeaderMixedNav'>): boolean {
  return computed.isSidebarMixedNav || computed.isHeaderMixedNav;
}

/**
 * 解析侧边栏折叠值（不可折叠时强制为 false）。
 * @param options 解析参数。
 * @returns 最终折叠值。
 */
export interface ResolveSidebarCollapsedValueOptions {
  /** 当前布局是否不可折叠。 */
  isNonCollapsible: boolean;
  /** 当前侧边栏折叠状态。 */
  sidebarCollapsed: boolean;
}

/**
 * 解析侧边栏折叠值（不可折叠时强制为 false）。
 * @param options 解析参数。
 * @returns 最终折叠值。
 */
export function resolveSidebarCollapsedValue(options: ResolveSidebarCollapsedValueOptions): boolean {
  return options.isNonCollapsible ? false : options.sidebarCollapsed;
}

/** 侧边栏折叠状态计算参数。 */
export interface ResolveNextSidebarCollapsedOptions {
  /** 当前布局是否不可折叠。 */
  isNonCollapsible: boolean;
  /** 当前折叠状态。 */
  currentCollapsed: boolean;
  /** 目标折叠状态。 */
  requestedCollapsed: boolean;
}

/** 侧边栏折叠状态计算结果。 */
export interface NextSidebarCollapsedResult {
  /** 计算后的折叠状态。 */
  nextCollapsed: boolean;
  /** 是否发生变化。 */
  changed: boolean;
}

/**
 * 计算下一次侧边栏折叠状态及是否变化。
 * @param options 计算参数。
 * @returns 新状态与变更标记。
 */
export function resolveNextSidebarCollapsed(
  options: ResolveNextSidebarCollapsedOptions
): NextSidebarCollapsedResult {
  const nextCollapsed = options.isNonCollapsible ? false : options.requestedCollapsed;
  return {
    nextCollapsed,
    changed: options.currentCollapsed !== nextCollapsed,
  };
}

/** 侧边栏折叠切换参数。 */
export interface ResolveSidebarToggleCollapsedOptions {
  /** 当前布局是否不可折叠。 */
  isNonCollapsible: boolean;
  /** 当前折叠状态。 */
  currentCollapsed: boolean;
}

/**
 * 计算触发折叠切换后的侧边栏状态。
 * @param options 计算参数。
 * @returns 下一次折叠状态。
 */
export function resolveSidebarToggleCollapsed(
  options: ResolveSidebarToggleCollapsedOptions
): boolean {
  if (options.isNonCollapsible) return options.currentCollapsed;
  return !options.currentCollapsed;
}

/** 鼠标移入侧边栏时的效果计算参数。 */
export interface ResolveSidebarMouseEnterEffectsOptions {
  /** 是否启用悬浮展开。 */
  expandOnHover: boolean;
  /** 当前是否折叠。 */
  collapsed: boolean;
}

/** 鼠标移入侧边栏时的状态补丁。 */
export interface SidebarMouseEnterEffects {
  /** 当前是否处于悬浮展开态。 */
  expandOnHovering?: boolean;
}

/**
 * 计算侧边栏鼠标移入副作用。
 * @param options 计算参数。
 * @returns 需要合并的状态补丁。
 */
export function resolveSidebarMouseEnterEffects(
  options: ResolveSidebarMouseEnterEffectsOptions
): SidebarMouseEnterEffects {
  if (options.expandOnHover && options.collapsed) {
    return { expandOnHovering: true };
  }
  return {};
}

/** 鼠标移出侧边栏时的效果计算参数。 */
export interface ResolveSidebarMouseLeaveEffectsOptions {
  /** 当前是否处于悬浮展开态。 */
  expandOnHovering: boolean;
  /** 是否启用悬浮展开。 */
  expandOnHover: boolean;
}

/** 鼠标移出侧边栏时的状态补丁。 */
export interface SidebarMouseLeaveEffects {
  /** 当前是否处于悬浮展开态。 */
  expandOnHovering?: boolean;
  /** 侧边栏扩展区是否可见。 */
  extraVisible?: boolean;
}

/**
 * 计算侧边栏鼠标移出副作用。
 * @param options 计算参数。
 * @returns 需要合并的状态补丁。
 */
export function resolveSidebarMouseLeaveEffects(
  options: ResolveSidebarMouseLeaveEffectsOptions
): SidebarMouseLeaveEffects {
  const patch: SidebarMouseLeaveEffects = {};
  if (options.expandOnHovering) {
    patch.expandOnHovering = false;
  }
  if (options.expandOnHover) {
    patch.extraVisible = false;
  }
  return patch;
}

/**
 * 解析顶部栏模式，非法值回退到 `fixed`。
 * @param mode 原始模式值。
 * @returns 标准化模式。
 */
export function resolveHeaderMode(mode: unknown): HeaderMode {
  return mode === 'auto' || mode === 'auto-scroll' || mode === 'static' ? mode : 'fixed';
}

/**
 * 判断模式是否支持自动隐藏顶部栏。
 * @param mode 顶部栏模式。
 * @returns 是否自动隐藏模式。
 */
export function isHeaderAutoHideMode(mode: HeaderMode): boolean {
  return mode === 'auto' || mode === 'auto-scroll';
}

/** 顶栏最终隐藏状态计算参数。 */
export interface ResolveHeaderHiddenOptions {
  /** 运行态隐藏状态。 */
  stateHidden: boolean;
  /** 配置层隐藏状态。 */
  configHidden: boolean;
}

/**
 * 解析顶部栏最终隐藏状态。
 * @param options 状态与配置输入。
 * @returns 是否隐藏。
 */
export function resolveHeaderHidden(options: ResolveHeaderHiddenOptions): boolean {
  return options.stateHidden || options.configHidden;
}

/** 基于鼠标位置计算顶栏隐藏状态的参数。 */
export interface ResolveHeaderMouseHiddenOptions {
  /** 当前鼠标 y 坐标。 */
  mouseY: number;
  /** 当前隐藏状态。 */
  currentHidden: boolean;
  /** 触发距离阈值。 */
  triggerDistance?: number;
}

/**
 * 基于鼠标纵向位置计算顶部栏隐藏状态。
 * @param options 计算参数。
 * @returns 下一次隐藏状态。
 */
export function resolveHeaderMouseHidden(options: ResolveHeaderMouseHiddenOptions): boolean {
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

/** 基于滚动行为计算顶栏隐藏状态的参数。 */
export interface ResolveHeaderScrollHiddenOptions {
  /** 顶部栏模式。 */
  mode: HeaderMode;
  /** 当前隐藏状态。 */
  currentHidden: boolean;
  /** 当前滚动位置。 */
  currentScrollY: number;
  /** 上次滚动位置。 */
  lastScrollY: number;
  /** 顶部栏高度。 */
  headerHeight: number;
  /** 当前鼠标 y 坐标。 */
  mouseY: number;
  /** 触发距离阈值。 */
  triggerDistance?: number;
}

/** 顶栏滚动隐藏状态计算结果。 */
export interface HeaderScrollHiddenResult {
  /** 计算后的隐藏状态。 */
  hidden: boolean;
  /** 更新后的滚动基线。 */
  lastScrollY: number;
}

/**
 * 基于滚动行为计算顶部栏隐藏状态。
 * @param options 计算参数。
 * @returns 隐藏状态与更新后的滚动基线。
 */
export function resolveHeaderScrollHidden(
  options: ResolveHeaderScrollHiddenOptions
): HeaderScrollHiddenResult {
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

/**
 * 解析面板位置。
 * @param panel 面板配置。
 * @returns 面板位置。
 */
export function resolvePanelPosition(panel: BasicLayoutProps['panel'] | undefined): string {
  return panel?.position || 'right';
}

/**
 * 计算下一次面板折叠状态及是否变化。
 * @param currentCollapsed 当前折叠状态。
 * @param requestedCollapsed 目标折叠状态。
 * @returns 新状态与变更标记。
 */
export interface NextPanelCollapsedResult {
  /** 计算后的折叠状态。 */
  nextCollapsed: boolean;
  /** 是否发生变化。 */
  changed: boolean;
}

/**
 * 计算下一次面板折叠状态及是否变化。
 * @param currentCollapsed 当前折叠状态。
 * @param requestedCollapsed 目标折叠状态。
 * @returns 新状态与变更标记。
 */
export function resolveNextPanelCollapsed(
  currentCollapsed: boolean,
  requestedCollapsed: boolean
): NextPanelCollapsedResult {
  return {
    nextCollapsed: requestedCollapsed,
    changed: currentCollapsed !== requestedCollapsed,
  };
}

/** 响应式设备标记。 */
export interface ResponsiveFlags {
  /** 是否移动端。 */
  isMobile: boolean;
  /** 是否平板端。 */
  isTablet: boolean;
  /** 是否桌面端。 */
  isDesktop: boolean;
}

/**
 * 根据宽度解析设备类型标记。
 * @param width 视口宽度。
 * @returns 移动端/平板/桌面标记。
 */
export function resolveResponsiveFlags(width: number): ResponsiveFlags {
  return {
    isMobile: width < BREAKPOINTS.md,
    isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isDesktop: width >= BREAKPOINTS.lg,
  };
}

/**
 * 根据宽度解析响应式断点。
 * @param width 视口宽度。
 * @returns 断点名称。
 */
export function resolveResponsiveBreakpoint(width: number): ResponsiveBreakpoint {
  if (width < BREAKPOINTS.sm) return 'xs';
  if (width < BREAKPOINTS.md) return 'sm';
  if (width < BREAKPOINTS.lg) return 'md';
  if (width < BREAKPOINTS.xl) return 'lg';
  if (width < BREAKPOINTS['2xl']) return 'xl';
  return '2xl';
}

/** 视口宽度更新结果。 */
export interface ViewportWidthChange {
  /** 宽度。 */
  width: number;
  /** 是否发生变化。 */
  changed: boolean;
}

/**
 * 计算视口宽度更新结果。
 * @param currentWidth 当前宽度。
 * @param nextWidth 下一个宽度。
 * @returns 宽度值与变更标记。
 */
export function resolveViewportWidthChange(
  currentWidth: number,
  nextWidth: number
): ViewportWidthChange {
  return {
    width: nextWidth,
    changed: currentWidth !== nextWidth,
  };
}
