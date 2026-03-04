/**
 * 侧边栏运行时状态公共工具
 * @description 提供 React/Vue 共用的侧边栏折叠与悬停交互控制逻辑
 */

import {
  isSidebarNonCollapsible,
  resolveNextSidebarCollapsed,
  resolveSidebarCollapsedValue,
  resolveSidebarMouseEnterEffects,
  resolveSidebarMouseLeaveEffects,
  resolveSidebarToggleCollapsed,
} from './layout-regions-state';
import type { LayoutComputed, LayoutState } from '../types';

/** 侧边栏状态切片。 */
type SidebarStateSlice = Pick<
  LayoutState,
  | 'sidebarCollapsed'
  | 'sidebarExpandOnHovering'
  | 'sidebarExtraVisible'
  | 'sidebarExtraCollapsed'
  | 'sidebarExpandOnHover'
>;

/** 侧边栏计算状态切片。 */
type SidebarComputedSlice = Pick<LayoutComputed, 'isSidebarMixedNav' | 'isHeaderMixedNav'>;

/** 侧边栏运行时快照。 */
export interface SidebarRuntimeSnapshot {
  /** 当前布局是否不允许折叠侧边栏。 */
  isNonCollapsible: boolean;
  /** 当前折叠状态。 */
  collapsed: boolean;
  /** 当前是否悬浮展开。 */
  expandOnHovering: boolean;
  /** 侧边扩展区是否可见。 */
  extraVisible: boolean;
  /** 侧边扩展区是否折叠。 */
  extraCollapsed: boolean;
  /** 是否启用悬浮展开。 */
  expandOnHover: boolean;
}

/** 侧边栏状态控制器创建参数。 */
export interface CreateLayoutSidebarStateControllerOptions {
  /** 获取状态切片。 */
  getState: () => SidebarStateSlice;
  /** 获取计算状态切片。 */
  getLayoutComputed: () => SidebarComputedSlice;
  /** 写入状态补丁。 */
  setState: (patch: Partial<SidebarStateSlice>) => void;
  /** 侧边栏折叠状态变化时触发。 */
  onSidebarCollapse?: (collapsed: boolean) => void;
}

/** 侧边栏状态控制器。 */
export interface LayoutSidebarStateController {
  /** 获取运行时快照。 */
  getSnapshot: () => SidebarRuntimeSnapshot;
  /** 设置折叠状态。 */
  setCollapsed: (value: boolean) => boolean;
  /** 切换折叠状态。 */
  toggle: () => boolean;
  /** 设置悬浮展开状态。 */
  setExpandOnHovering: (value: boolean) => boolean;
  /** 设置扩展区可见状态。 */
  setExtraVisible: (value: boolean) => boolean;
  /** 设置扩展区折叠状态。 */
  setExtraCollapsed: (value: boolean) => boolean;
  /** 设置是否启用悬浮展开。 */
  setExpandOnHover: (value: boolean) => boolean;
  /** 处理鼠标移入。 */
  handleMouseEnter: () => void;
  /** 处理鼠标移出。 */
  handleMouseLeave: () => void;
}

/**
 * 更新布尔状态字段（仅在变化时写入）。
 * @param options 控制器参数。
 * @param key 状态键。
 * @param value 目标值。
 * @returns 是否发生更新。
 */
function updateStateBoolean(
  options: CreateLayoutSidebarStateControllerOptions,
  key: keyof SidebarStateSlice,
  value: boolean
): boolean {
  const current = options.getState()[key];
  if (current === value) return false;
  options.setState({ [key]: value } as Partial<SidebarStateSlice>);
  return true;
}

/**
 * 创建侧边栏状态控制器
 * @param options 侧边栏状态控制器参数。
 * @returns 侧边栏状态控制器。
 */
export function createLayoutSidebarStateController(
  options: CreateLayoutSidebarStateControllerOptions
): LayoutSidebarStateController {
  /**
   * 读取当前侧边栏运行时快照。
   * @returns 侧边栏快照。
   */
  const getSnapshot = (): SidebarRuntimeSnapshot => {
    const state = options.getState();
    const computed = options.getLayoutComputed();
    const isNonCollapsible = isSidebarNonCollapsible(computed);
    return {
      isNonCollapsible,
      collapsed: resolveSidebarCollapsedValue({
        isNonCollapsible,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
      expandOnHovering: state.sidebarExpandOnHovering,
      extraVisible: state.sidebarExtraVisible,
      extraCollapsed: state.sidebarExtraCollapsed ?? false,
      expandOnHover: state.sidebarExpandOnHover ?? false,
    };
  };

  /**
   * 设置侧边栏折叠状态。
   * @param value 目标折叠状态。
   * @returns 是否发生状态更新。
   */
  const setCollapsed = (value: boolean): boolean => {
    const state = options.getState();
    const next = resolveNextSidebarCollapsed({
      isNonCollapsible: isSidebarNonCollapsible(options.getLayoutComputed()),
      currentCollapsed: state.sidebarCollapsed,
      requestedCollapsed: value,
    });
    if (!next.changed) return false;
    options.setState({ sidebarCollapsed: next.nextCollapsed });
    options.onSidebarCollapse?.(next.nextCollapsed);
    return true;
  };

  /**
   * 切换侧边栏折叠状态。
   * @returns 是否发生状态更新。
   */
  const toggle = (): boolean => {
    const snapshot = getSnapshot();
    const nextCollapsed = resolveSidebarToggleCollapsed({
      isNonCollapsible: snapshot.isNonCollapsible,
      currentCollapsed: snapshot.collapsed,
    });
    return setCollapsed(nextCollapsed);
  };

  /**
   * 设置悬停展开临时状态。
   * @param value 目标状态。
   * @returns 是否发生状态更新。
   */
  const setExpandOnHovering = (value: boolean): boolean =>
    updateStateBoolean(options, 'sidebarExpandOnHovering', value);

  /**
   * 设置侧边栏额外区域可见状态。
   * @param value 目标状态。
   * @returns 是否发生状态更新。
   */
  const setExtraVisible = (value: boolean): boolean =>
    updateStateBoolean(options, 'sidebarExtraVisible', value);

  /**
   * 设置侧边栏额外区域折叠状态。
   * @param value 目标状态。
   * @returns 是否发生状态更新。
   */
  const setExtraCollapsed = (value: boolean): boolean =>
    updateStateBoolean(options, 'sidebarExtraCollapsed', value);

  /**
   * 设置“悬停展开”配置开关。
   * @param value 目标配置值。
   * @returns 是否发生状态更新。
   */
  const setExpandOnHover = (value: boolean): boolean =>
    updateStateBoolean(options, 'sidebarExpandOnHover', value);

  /**
   * 处理侧边栏鼠标移入。
   */
  const handleMouseEnter = () => {
    const snapshot = getSnapshot();
    const effect = resolveSidebarMouseEnterEffects({
      expandOnHover: snapshot.expandOnHover,
      collapsed: snapshot.collapsed,
    });
    if (effect.expandOnHovering === true) {
      setExpandOnHovering(true);
    }
  };

  /**
   * 处理侧边栏鼠标移出。
   */
  const handleMouseLeave = () => {
    const snapshot = getSnapshot();
    const effect = resolveSidebarMouseLeaveEffects({
      expandOnHovering: snapshot.expandOnHovering,
      expandOnHover: snapshot.expandOnHover,
    });
    if (effect.expandOnHovering === false) {
      setExpandOnHovering(false);
    }
    if (effect.extraVisible === false) {
      setExtraVisible(false);
    }
  };

  return {
    getSnapshot,
    setCollapsed,
    toggle,
    setExpandOnHovering,
    setExtraVisible,
    setExtraCollapsed,
    setExpandOnHover,
    handleMouseEnter,
    handleMouseLeave,
  };
}
