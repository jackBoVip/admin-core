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

type SidebarStateSlice = Pick<
  LayoutState,
  | 'sidebarCollapsed'
  | 'sidebarExpandOnHovering'
  | 'sidebarExtraVisible'
  | 'sidebarExtraCollapsed'
  | 'sidebarExpandOnHover'
>;

type SidebarComputedSlice = Pick<LayoutComputed, 'isSidebarMixedNav' | 'isHeaderMixedNav'>;

export interface SidebarRuntimeSnapshot {
  isNonCollapsible: boolean;
  collapsed: boolean;
  expandOnHovering: boolean;
  extraVisible: boolean;
  extraCollapsed: boolean;
  expandOnHover: boolean;
}

export interface CreateLayoutSidebarStateControllerOptions {
  getState: () => SidebarStateSlice;
  getLayoutComputed: () => SidebarComputedSlice;
  setState: (patch: Partial<SidebarStateSlice>) => void;
  onSidebarCollapse?: (collapsed: boolean) => void;
}

export interface LayoutSidebarStateController {
  getSnapshot: () => SidebarRuntimeSnapshot;
  setCollapsed: (value: boolean) => boolean;
  toggle: () => boolean;
  setExpandOnHovering: (value: boolean) => boolean;
  setExtraVisible: (value: boolean) => boolean;
  setExtraCollapsed: (value: boolean) => boolean;
  setExpandOnHover: (value: boolean) => boolean;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
}

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
 */
export function createLayoutSidebarStateController(
  options: CreateLayoutSidebarStateControllerOptions
): LayoutSidebarStateController {
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

  const toggle = (): boolean => {
    const snapshot = getSnapshot();
    const nextCollapsed = resolveSidebarToggleCollapsed({
      isNonCollapsible: snapshot.isNonCollapsible,
      currentCollapsed: snapshot.collapsed,
    });
    return setCollapsed(nextCollapsed);
  };

  const setExpandOnHovering = (value: boolean): boolean =>
    updateStateBoolean(options, 'sidebarExpandOnHovering', value);

  const setExtraVisible = (value: boolean): boolean =>
    updateStateBoolean(options, 'sidebarExtraVisible', value);

  const setExtraCollapsed = (value: boolean): boolean =>
    updateStateBoolean(options, 'sidebarExtraCollapsed', value);

  const setExpandOnHover = (value: boolean): boolean =>
    updateStateBoolean(options, 'sidebarExpandOnHover', value);

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
