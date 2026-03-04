/**
 * 布局侧边栏区域状态 Hook（React）。
 * @description 统一管理侧边栏折叠、悬停展开、附加区状态与交互动作。
 */
import {
  applyStatePatch,
  createLayoutSidebarStateController,
  type LayoutComputed,
} from '@admin-core/layout';
import { useMemo } from 'react';
import { useLayoutComputed, useLayoutContext, useLayoutState } from '../use-layout-context';

/**
 * `useSidebarState` 返回值。
 */
export interface UseSidebarStateReturn {
  /** 侧边栏是否折叠。 */
  collapsed: boolean;
  /** 侧边栏是否处于“悬停展开中”状态。 */
  expandOnHovering: boolean;
  /** 侧边栏附加区域是否显示。 */
  extraVisible: boolean;
  /** 侧边栏附加区域是否折叠。 */
  extraCollapsed: boolean;
  /** 是否启用“悬停自动展开”。 */
  expandOnHover: boolean;
  /** 当前侧边栏宽度（像素）。 */
  width: number;
  /** 侧边栏是否可见。 */
  visible: boolean;
  /** 布局派生状态快照。 */
  layoutComputed: LayoutComputed;
  /** 显式设置侧边栏折叠状态。 */
  setCollapsed: (value: boolean) => void;
  /** 切换侧边栏折叠状态。 */
  toggle: () => void;
  /** 设置“悬停展开中”状态。 */
  setExpandOnHovering: (value: boolean) => void;
  /** 设置侧边栏附加区域显隐。 */
  setExtraVisible: (value: boolean) => void;
  /** 设置侧边栏附加区域折叠状态。 */
  setExtraCollapsed: (value: boolean) => void;
  /** 设置是否启用“悬停自动展开”。 */
  setExpandOnHover: (value: boolean) => void;
  /** 处理鼠标进入侧边栏。 */
  handleMouseEnter: () => void;
  /** 处理鼠标离开侧边栏。 */
  handleMouseLeave: () => void;
}

/**
 * 管理侧边栏区域状态。
 * @returns 侧边栏显隐、宽度、折叠态及交互控制方法。
 */
export function useSidebarState(): UseSidebarStateReturn {
  /**
   * 布局上下文。
   * @description 提供布局配置、事件总线与运行时状态容器。
   */
  const context = useLayoutContext();
  /**
   * 布局派生状态。
   * @description 提供侧边栏宽度、显隐等计算结果。
   */
  const computed = useLayoutComputed();
  /**
   * 布局运行时状态及写入函数。
   */
  const [state, setState] = useLayoutState();

  /**
   * 侧边栏状态控制器，统一处理折叠、悬停展开与附加区状态。
   */
  const controller = useMemo(
    () =>
      createLayoutSidebarStateController({
        getState: () => state,
        getLayoutComputed: () => computed,
        setState: (patch) => {
          setState((prev) => applyStatePatch(prev, patch).nextState);
        },
        onSidebarCollapse: (value) => context.events.onSidebarCollapse?.(value),
      }),
    [state, computed, setState, context.events]
  );

  /**
   * 侧边栏运行时快照。
   */
  const snapshot = controller.getSnapshot();
  const collapsed = snapshot.collapsed;
  const expandOnHovering = snapshot.expandOnHovering;
  const extraVisible = snapshot.extraVisible;
  const extraCollapsed = snapshot.extraCollapsed;
  const expandOnHover = snapshot.expandOnHover;
  const width = computed.sidebarWidth;
  const visible = computed.showSidebar;

  return {
    collapsed,
    expandOnHovering,
    extraVisible,
    extraCollapsed,
    expandOnHover,
    width,
    visible,
    layoutComputed: computed,
    setCollapsed: controller.setCollapsed,
    toggle: controller.toggle,
    setExpandOnHovering: controller.setExpandOnHovering,
    setExtraVisible: controller.setExtraVisible,
    setExtraCollapsed: controller.setExtraCollapsed,
    setExpandOnHover: controller.setExpandOnHover,
    handleMouseEnter: controller.handleMouseEnter,
    handleMouseLeave: controller.handleMouseLeave,
  };
}
