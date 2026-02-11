/**
 * 功能区运行时状态公共工具
 * @description 提供 React/Vue 共用的功能区折叠控制逻辑
 */

import { resolveNextPanelCollapsed, resolvePanelPosition } from './layout-regions-state';
import type { BasicLayoutProps, LayoutState } from '../types';

type PanelStateSlice = Pick<LayoutState, 'panelCollapsed'>;

export interface CreateLayoutPanelStateControllerOptions {
  getState: () => PanelStateSlice;
  setState: (patch: Partial<PanelStateSlice>) => void;
  getPanelConfig: () => BasicLayoutProps['panel'] | undefined;
  onPanelCollapse?: (collapsed: boolean) => void;
}

export interface LayoutPanelStateController {
  getCollapsed: () => boolean;
  getPosition: () => string;
  setCollapsed: (value: boolean) => boolean;
  toggle: () => boolean;
}

/**
 * 创建功能区状态控制器
 */
export function createLayoutPanelStateController(
  options: CreateLayoutPanelStateControllerOptions
): LayoutPanelStateController {
  const getCollapsed = () => options.getState().panelCollapsed;

  const getPosition = () => resolvePanelPosition(options.getPanelConfig());

  const setCollapsed = (value: boolean): boolean => {
    const current = getCollapsed();
    const next = resolveNextPanelCollapsed(current, value);
    if (!next.changed) return false;
    options.setState({ panelCollapsed: next.nextCollapsed });
    options.onPanelCollapse?.(next.nextCollapsed);
    return true;
  };

  const toggle = (): boolean => setCollapsed(!getCollapsed());

  return {
    getCollapsed,
    getPosition,
    setCollapsed,
    toggle,
  };
}
