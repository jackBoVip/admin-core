/**
 * 布局功能面板区域状态 Hook（React）。
 * @description 管理面板显隐、位置、宽度与折叠交互状态。
 */
import { applyStatePatch, createLayoutPanelStateController } from '@admin-core/layout';
import { useMemo } from 'react';
import { useLayoutComputed, useLayoutContext, useLayoutState } from '../use-layout-context';

/**
 * 面板位置类型。
 * @description 由面板状态控制器返回值推导，保持与 core 层实现一致。
 */
type PanelPosition = ReturnType<
  ReturnType<typeof createLayoutPanelStateController>['getPosition']
>;

/**
 * `usePanelState` 返回值。
 */
export interface UsePanelStateReturn {
  /** 面板是否折叠。 */
  collapsed: boolean;
  /** 面板宽度（像素）。 */
  width: number;
  /** 面板是否可见。 */
  visible: boolean;
  /** 面板停靠位置。 */
  position: PanelPosition;
  /** 显式设置面板折叠状态。 */
  setCollapsed: (value: boolean) => void;
  /** 切换面板折叠状态。 */
  toggle: () => void;
}

/**
 * 管理功能面板区域状态。
 * @returns 面板显隐、宽度、位置与折叠控制方法。
 */
export function usePanelState(): UsePanelStateReturn {
  /**
   * 布局上下文。
   * @description 提供面板配置、事件总线与运行时状态容器。
   */
  const context = useLayoutContext();
  /**
   * 布局派生状态。
   * @description 提供面板宽度与显隐等计算结果。
   */
  const computed = useLayoutComputed();
  /**
   * 布局运行时状态及写入函数。
   */
  const [state, setState] = useLayoutState();

  /**
   * 面板状态控制器。
   */
  const controller = useMemo(
    () =>
      createLayoutPanelStateController({
        getState: () => state,
        setState: (patch) => {
          setState((prev) => applyStatePatch(prev, patch).nextState);
        },
        getPanelConfig: () => context.props.panel,
        onPanelCollapse: (value) => context.events.onPanelCollapse?.(value),
      }),
    [state, setState, context.props.panel, context.events]
  );

  /**
   * 当前面板折叠状态。
   */
  const collapsed = controller.getCollapsed();
  /**
   * 当前面板宽度（像素）。
   */
  const width = computed.panelWidth;
  /**
   * 当前面板可见状态。
   */
  const visible = computed.showPanel;
  /**
   * 当前面板停靠位置。
   */
  const position = controller.getPosition();

  return {
    collapsed,
    width,
    visible,
    position,
    setCollapsed: controller.setCollapsed,
    toggle: controller.toggle,
  };
}
