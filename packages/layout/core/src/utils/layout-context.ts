/**
 * Layout context helpers
 * @description 提取 React/Vue 共用的布局上下文逻辑
 */

import { DEFAULT_LAYOUT_STATE } from '../constants';
import {
  isHeaderMixedNavLayout,
  isSidebarMixedNavLayout,
  resolveLayoutType as resolveLayoutTypeFromUtils,
} from './layout';
import type { BasicLayoutProps, LayoutState } from '../types';

type NoInfer<T> = [T][T extends unknown ? 0 : never];
type ContextStateSlice = Pick<
  LayoutState,
  'sidebarCollapsed' | 'panelCollapsed' | 'openMenuKeys'
>;

/**
 * 是否为侧边混合布局
 */
export function isSidebarMixedLayout(props: BasicLayoutProps): boolean {
  const layout = resolveLayoutTypeFromUtils(props);
  return isSidebarMixedNavLayout(layout) || isHeaderMixedNavLayout(layout);
}

/**
 * 获取初始布局状态
 */
export function getInitialLayoutState(props: BasicLayoutProps): LayoutState {
  return {
    ...DEFAULT_LAYOUT_STATE,
    sidebarCollapsed: isSidebarMixedLayout(props)
      ? false
      : (props.sidebar?.collapsed ?? DEFAULT_LAYOUT_STATE.sidebarCollapsed),
    sidebarExpandOnHover:
      props.sidebar?.expandOnHover ?? DEFAULT_LAYOUT_STATE.sidebarExpandOnHover,
    panelCollapsed:
      props.panel?.collapsed ?? DEFAULT_LAYOUT_STATE.panelCollapsed,
  };
}

export interface LayoutStatePatchResult {
  patch: Partial<LayoutState>;
  changed: boolean;
  sidebarCollapseChanged?: boolean;
}

export interface ApplyStatePatchResult<TState> {
  nextState: TState;
  changed: boolean;
}

/**
 * 根据 props 生成布局状态补丁
 */
export function getLayoutStatePatchFromProps(
  prevState: LayoutState,
  props: BasicLayoutProps
): LayoutStatePatchResult {
  const patch: Partial<LayoutState> = {};
  let changed = false;
  let sidebarCollapseChanged: boolean | undefined;

  const update = (next: Partial<LayoutState>) => {
    changed = true;
    Object.assign(patch, next);
  };

  if (isSidebarMixedLayout(props)) {
    if (prevState.sidebarCollapsed) {
      update({ sidebarCollapsed: false });
      sidebarCollapseChanged = false;
    }
  } else if (
    props.sidebar?.collapsed !== undefined &&
    prevState.sidebarCollapsed !== props.sidebar.collapsed
  ) {
    update({ sidebarCollapsed: props.sidebar.collapsed });
    sidebarCollapseChanged = props.sidebar.collapsed;
  }

  if (
    props.sidebar?.expandOnHover !== undefined &&
    prevState.sidebarExpandOnHover !== props.sidebar.expandOnHover
  ) {
    update({ sidebarExpandOnHover: props.sidebar.expandOnHover });
  }

  if (
    props.panel?.collapsed !== undefined &&
    prevState.panelCollapsed !== props.panel.collapsed
  ) {
    update({ panelCollapsed: props.panel.collapsed });
  }

  return { patch, changed, sidebarCollapseChanged };
}

/**
 * 返回合并 patch 后的新状态（无变化时复用原引用）
 */
export function applyStatePatch<TState extends object>(
  prevState: TState,
  patch: Partial<NoInfer<TState>>
): ApplyStatePatchResult<TState> {
  const entries = Object.entries(patch as Record<string, unknown>) as [
    keyof TState,
    TState[keyof TState],
  ][];
  if (entries.length === 0) {
    return { nextState: prevState, changed: false };
  }

  let nextState: TState | null = null;

  for (const [key, value] of entries) {
    const currentValue = prevState[key];
    if (currentValue === value) continue;
    if (!nextState) {
      nextState = { ...prevState };
    }
    nextState[key] = value;
  }

  if (!nextState) {
    return { nextState: prevState, changed: false };
  }

  return { nextState, changed: true };
}

/**
 * 原地应用 patch（仅在值变化时写入）
 */
export function applyStatePatchMutable<TState extends object>(
  state: TState,
  patch: Partial<NoInfer<TState>>
): boolean {
  let changed = false;
  const entries = Object.entries(patch as Record<string, unknown>) as [
    keyof TState,
    TState[keyof TState],
  ][];
  for (const [key, value] of entries) {
    if (state[key] === value) continue;
    state[key] = value;
    changed = true;
  }
  return changed;
}

export interface CreateLayoutContextActionsControllerOptions {
  getProps: () => BasicLayoutProps;
  getState: () => ContextStateSlice;
  setState: (patch: Partial<ContextStateSlice>) => void;
  onSidebarCollapse?: (collapsed: boolean) => void;
  onPanelCollapse?: (collapsed: boolean) => void;
}

export interface LayoutContextActionsController {
  toggleSidebarCollapse: () => boolean;
  togglePanelCollapse: () => boolean;
  setOpenMenuKeys: (keys: string[]) => boolean;
}

/**
 * 创建布局上下文基础交互控制器（React/Vue 共享）
 */
export function createLayoutContextActionsController(
  options: CreateLayoutContextActionsControllerOptions
): LayoutContextActionsController {
  const toggleSidebarCollapse = (): boolean => {
    const state = options.getState();
    const nextCollapsed = isSidebarMixedLayout(options.getProps())
      ? false
      : !state.sidebarCollapsed;
    if (nextCollapsed === state.sidebarCollapsed) return false;
    options.setState({ sidebarCollapsed: nextCollapsed });
    options.onSidebarCollapse?.(nextCollapsed);
    return true;
  };

  const togglePanelCollapse = (): boolean => {
    const state = options.getState();
    const nextCollapsed = !state.panelCollapsed;
    if (nextCollapsed === state.panelCollapsed) return false;
    options.setState({ panelCollapsed: nextCollapsed });
    options.onPanelCollapse?.(nextCollapsed);
    return true;
  };

  const setOpenMenuKeys = (keys: string[]): boolean => {
    const state = options.getState();
    const prevKeys = state.openMenuKeys;
    if (prevKeys.length === keys.length) {
      let same = true;
      for (let index = 0; index < keys.length; index += 1) {
        if (prevKeys[index] !== keys[index]) {
          same = false;
          break;
        }
      }
      if (same) return false;
    }
    options.setState({ openMenuKeys: keys });
    return true;
  };

  return {
    toggleSidebarCollapse,
    togglePanelCollapse,
    setOpenMenuKeys,
  };
}

export interface CreateLayoutPropsStateSyncControllerOptions {
  getState: () => LayoutState;
  setState: (patch: Partial<LayoutState>) => void;
  onSidebarCollapse?: (collapsed: boolean) => void;
}

export interface LayoutPropsStateSyncController {
  syncProps: (props: BasicLayoutProps) => boolean;
}

/**
 * 创建 props->state 同步控制器（React/Vue 共享）
 */
export function createLayoutPropsStateSyncController(
  options: CreateLayoutPropsStateSyncControllerOptions
): LayoutPropsStateSyncController {
  const syncProps = (props: BasicLayoutProps): boolean => {
    const currentState = options.getState();
    const { patch, changed, sidebarCollapseChanged } = getLayoutStatePatchFromProps(
      currentState,
      props
    );
    if (!changed) return false;
    options.setState(patch);
    if (sidebarCollapseChanged !== undefined) {
      options.onSidebarCollapse?.(sidebarCollapseChanged);
    }
    return true;
  };

  return {
    syncProps,
  };
}
