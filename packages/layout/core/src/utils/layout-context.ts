/**
 * Layout context helpers
 * @description 提取 React/Vue 共用的布局上下文逻辑
 */

import { DEFAULT_LAYOUT_STATE } from '../constants';
import { isHeaderMixedNavLayout, isSidebarMixedNavLayout } from './layout';
import type { BasicLayoutProps, LayoutState } from '../types';
import type { LayoutType } from '@admin-core/preferences';

/**
 * 解析真实布局类型（处理移动端强制布局）
 */
export function resolveLayoutType(props: BasicLayoutProps): LayoutType {
  return (props.isMobile ? 'sidebar-nav' : (props.layout || 'sidebar-nav')) as LayoutType;
}

/**
 * 是否为侧边混合布局
 */
export function isSidebarMixedLayout(props: BasicLayoutProps): boolean {
  const layout = resolveLayoutType(props);
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
