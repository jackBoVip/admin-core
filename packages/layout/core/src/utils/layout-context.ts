/**
 * 布局上下文工具函数。
 * @description 抽离 React/Vue 共用的布局上下文状态与动作编排逻辑。
 */

import { DEFAULT_LAYOUT_STATE } from '../constants';
import {
  isHeaderMixedNavLayout,
  isSidebarMixedNavLayout,
  resolveLayoutType as resolveLayoutTypeFromUtils,
} from './layout';
import type { BasicLayoutProps, LayoutState } from '../types';

/**
 * 阻止泛型被自动推断的工具类型。
 * @description 用于在 `patch` 参数中保留调用方显式指定的泛型约束。
 */
type NoInfer<T> = [T][T extends unknown ? 0 : never];
/**
 * 上下文状态切片类型。
 * @description 仅包含布局上下文交互阶段需要读写的最小状态集。
 */
type ContextStateSlice = Pick<
  LayoutState,
  'sidebarCollapsed' | 'panelCollapsed' | 'openMenuKeys'
>;

/**
 * 判断是否为侧边混合布局。
 * @param props 布局配置。
 * @returns 是否命中侧边混合布局。
 */
export function isSidebarMixedLayout(props: BasicLayoutProps): boolean {
  const layout = resolveLayoutTypeFromUtils(props);
  return isSidebarMixedNavLayout(layout) || isHeaderMixedNavLayout(layout);
}

/**
 * 获取初始布局状态。
 * @param props 布局配置。
 * @returns 初始布局状态。
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

/**
 * 布局状态补丁结果。
 */
export interface LayoutStatePatchResult {
  /** 需要应用的补丁。 */
  patch: Partial<LayoutState>;
  /** 是否有变更。 */
  changed: boolean;
  /** 侧边栏折叠状态变更值。 */
  sidebarCollapseChanged?: boolean;
}

/**
 * 状态补丁应用结果。
 */
export interface ApplyStatePatchResult<TState> {
  /** 应用后的状态。 */
  nextState: TState;
  /** 是否有变更。 */
  changed: boolean;
}

/**
 * 根据 props 生成布局状态补丁。
 * @param prevState 当前状态。
 * @param props 最新布局配置。
 * @returns 状态补丁结果。
 */
export function getLayoutStatePatchFromProps(
  prevState: LayoutState,
  props: BasicLayoutProps
): LayoutStatePatchResult {
  const patch: Partial<LayoutState> = {};
  let changed = false;
  let sidebarCollapseChanged: boolean | undefined;

  /**
   * 合并状态补丁并标记已变更。
   * @param next 增量状态补丁。
   * @returns 无返回值。
   */
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
 * 返回合并 patch 后的新状态（无变化时复用原引用）。
 * @param prevState 旧状态。
 * @param patch 状态补丁。
 * @returns 补丁应用结果。
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
 * 原地应用 patch（仅在值变化时写入）。
 * @param state 当前状态对象。
 * @param patch 状态补丁。
 * @returns 是否发生状态变更。
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

/**
 * 布局上下文动作控制器创建选项。
 */
export interface CreateLayoutContextActionsControllerOptions {
  /** 获取当前 props。 */
  getProps: () => BasicLayoutProps;
  /** 获取当前状态切片。 */
  getState: () => ContextStateSlice;
  /** 写入状态补丁。 */
  setState: (patch: Partial<ContextStateSlice>) => void;
  /**
   * 侧边栏折叠事件回调。
   * @param collapsed 当前折叠状态。
   */
  onSidebarCollapse?: (collapsed: boolean) => void;
  /**
   * 功能区折叠事件回调。
   * @param collapsed 当前折叠状态。
   */
  onPanelCollapse?: (collapsed: boolean) => void;
}

/**
 * 布局上下文动作控制器。
 */
export interface LayoutContextActionsController {
  /** 切换侧边栏折叠。 */
  toggleSidebarCollapse: () => boolean;
  /** 切换面板折叠。 */
  togglePanelCollapse: () => boolean;
  /** 设置展开菜单键集合。 */
  setOpenMenuKeys: (keys: string[]) => boolean;
}

/**
 * 创建布局上下文基础交互控制器（React/Vue 共享）。
 * @param options 控制器依赖项。
 * @returns 布局上下文动作控制器。
 */
export function createLayoutContextActionsController(
  options: CreateLayoutContextActionsControllerOptions
): LayoutContextActionsController {
  /**
   * 切换侧边栏折叠状态。
   * @returns 是否发生状态变更。
   */
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

  /**
   * 切换功能区折叠状态。
   * @returns 是否发生状态变更。
   */
  const togglePanelCollapse = (): boolean => {
    const state = options.getState();
    const nextCollapsed = !state.panelCollapsed;
    if (nextCollapsed === state.panelCollapsed) return false;
    options.setState({ panelCollapsed: nextCollapsed });
    options.onPanelCollapse?.(nextCollapsed);
    return true;
  };

  /**
   * 写入展开菜单 key 列表。
   * @param keys 展开菜单键集合。
   * @returns 是否发生状态变更。
   */
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

/**
 * props->state 同步控制器创建选项。
 * @description 定义外部 props 同步到内部布局状态所需的依赖函数集合。
 */
export interface CreateLayoutPropsStateSyncControllerOptions {
  /** 获取当前状态。 */
  getState: () => LayoutState;
  /** 写入状态补丁。 */
  setState: (patch: Partial<LayoutState>) => void;
  /**
   * 侧边栏折叠事件回调。
   * @param collapsed 当前折叠状态。
   */
  onSidebarCollapse?: (collapsed: boolean) => void;
}

/**
 * props->state 同步控制器。
 * @description 对外暴露 props 同步方法，供 React/Vue 适配层调用。
 */
export interface LayoutPropsStateSyncController {
  /** 同步 props 到状态。 */
  syncProps: (props: BasicLayoutProps) => boolean;
}

/**
 * 创建 props->state 同步控制器（React/Vue 共享）。
 * @param options 控制器依赖项。
 * @returns props 同步控制器。
 */
export function createLayoutPropsStateSyncController(
  options: CreateLayoutPropsStateSyncControllerOptions
): LayoutPropsStateSyncController {
  /**
   * 将外部 props 同步到内部状态。
   * @param props 最新布局配置。
   * @returns 是否发生状态变更。
   */
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
