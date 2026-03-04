/**
 * 功能区运行时状态公共工具
 * @description 提供 React/Vue 共用的功能区折叠控制逻辑
 */

import { resolveNextPanelCollapsed, resolvePanelPosition } from './layout-regions-state';
import type { BasicLayoutProps, LayoutState } from '../types';

/**
 * 面板状态切片，仅包含本控制器关注的字段。
 */
type PanelStateSlice = Pick<LayoutState, 'panelCollapsed'>;

/**
 * 功能区状态控制器创建参数。
 */
export interface CreateLayoutPanelStateControllerOptions {
  /** 读取当前面板状态。 */
  getState: () => PanelStateSlice;
  /** 写入面板状态补丁。 */
  setState: (patch: Partial<PanelStateSlice>) => void;
  /** 读取当前面板配置。 */
  getPanelConfig: () => BasicLayoutProps['panel'] | undefined;
  /** 面板折叠状态变化时触发。 */
  onPanelCollapse?: (collapsed: boolean) => void;
}

/**
 * 功能区状态控制器接口。
 */
export interface LayoutPanelStateController {
  /** 获取当前折叠状态。 */
  getCollapsed: () => boolean;
  /** 获取当前面板位置。 */
  getPosition: () => string;
  /** 设置折叠状态，返回是否发生变化。 */
  setCollapsed: (value: boolean) => boolean;
  /** 切换折叠状态，返回是否发生变化。 */
  toggle: () => boolean;
}

/**
 * 创建功能区状态控制器。
 * @param options 控制器创建参数。
 * @returns 功能区状态控制器实例。
 */
export function createLayoutPanelStateController(
  options: CreateLayoutPanelStateControllerOptions
): LayoutPanelStateController {
  /**
   * 读取当前功能区折叠状态。
   * @returns 当前折叠状态。
   */
  const getCollapsed = () => options.getState().panelCollapsed;

  /**
   * 解析当前功能区位置。
   * @returns 功能区位置字符串。
   */
  const getPosition = () => resolvePanelPosition(options.getPanelConfig());

  /**
   * 设置功能区折叠状态。
   * @param value 目标折叠状态。
   * @returns 是否发生状态变化。
   */
  const setCollapsed = (value: boolean): boolean => {
    const current = getCollapsed();
    const next = resolveNextPanelCollapsed(current, value);
    if (!next.changed) return false;
    options.setState({ panelCollapsed: next.nextCollapsed });
    options.onPanelCollapse?.(next.nextCollapsed);
    return true;
  };

  /**
   * 切换功能区折叠状态。
   * @returns 是否发生状态变化。
   */
  const toggle = (): boolean => setCollapsed(!getCollapsed());

  return {
    getCollapsed,
    getPosition,
    setCollapsed,
    toggle,
  };
}
