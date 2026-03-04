import { applyStatePatchMutable, createLayoutPanelStateController } from '@admin-core/layout';
import { computed, type ComputedRef, type WritableComputedRef } from 'vue';
import { useLayoutComputed, useLayoutContext } from '../use-layout-context';

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
  /** 面板折叠状态（可写计算属性）。 */
  collapsed: WritableComputedRef<boolean>;
  /** 面板宽度（像素）。 */
  width: ComputedRef<number>;
  /** 面板是否可见。 */
  visible: ComputedRef<boolean>;
  /** 面板停靠位置。 */
  position: ComputedRef<PanelPosition>;
  /** 切换面板折叠状态。 */
  toggle: () => void;
}

/**
 * 管理功能面板区域状态。
 * @returns 面板显隐、宽度、位置与折叠控制方法。
 */
export function usePanelState(): UsePanelStateReturn {
  /**
   * 布局上下文
   * @description 提供面板配置、状态容器与事件分发能力。
   */
  const context = useLayoutContext();
  /**
   * 布局派生状态
   * @description 提供面板宽度、显隐与布局偏移计算结果。
   */
  const layoutComputed = useLayoutComputed();
  /**
   * 面板状态控制器。
   */
  const controller = createLayoutPanelStateController({
    getState: () => context.state,
    setState: (patch) => {
      applyStatePatchMutable(context.state, patch);
    },
    getPanelConfig: () => context.props.panel,
    onPanelCollapse: (value) => context.events.onPanelCollapse?.(value),
  });

  /**
   * 面板折叠状态双向绑定。
   */
  const collapsed = computed({
    get: () => controller.getCollapsed(),
    set: (value) => controller.setCollapsed(value),
  });

  /**
   * 面板宽度
   * @description 由布局派生状态给出当前有效宽度。
   */
  const width = computed(() => layoutComputed.value.panelWidth);
  /**
   * 面板是否可见
   * @description 由布局配置与当前状态综合判定。
   */
  const visible = computed(() => layoutComputed.value.showPanel);
  /**
   * 面板停靠位置
   * @description 返回 `left/right` 等当前有效停靠方向。
   */
  const position = computed(() => controller.getPosition());

  /**
   * 切换面板折叠状态。
   */
  const toggle = () => controller.toggle();

  return {
    collapsed,
    width,
    visible,
    position,
    toggle,
  };
}
