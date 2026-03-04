import {
  applyStatePatchMutable,
  createLayoutSidebarStateController,
  type LayoutComputed,
} from '@admin-core/layout';
import { computed, type ComputedRef, type WritableComputedRef } from 'vue';
import { useLayoutComputed, useLayoutContext } from '../use-layout-context';

/**
 * `useSidebarState` 返回值。
 */
export interface UseSidebarStateReturn {
  /** 侧边栏是否折叠（可写计算属性）。 */
  collapsed: WritableComputedRef<boolean>;
  /** 侧边栏是否处于“悬停展开中”状态（可写计算属性）。 */
  expandOnHovering: WritableComputedRef<boolean>;
  /** 侧边栏附加区域是否显示（可写计算属性）。 */
  extraVisible: WritableComputedRef<boolean>;
  /** 侧边栏附加区域是否折叠（可写计算属性）。 */
  extraCollapsed: WritableComputedRef<boolean>;
  /** 是否启用“悬停自动展开”（可写计算属性）。 */
  expandOnHover: WritableComputedRef<boolean>;
  /** 当前侧边栏宽度（像素）。 */
  width: ComputedRef<number>;
  /** 侧边栏是否可见。 */
  visible: ComputedRef<boolean>;
  /** 布局派生状态快照。 */
  layoutComputed: ComputedRef<LayoutComputed>;
  /** 切换侧边栏折叠状态。 */
  toggle: () => void;
  /** 处理鼠标进入侧边栏。 */
  handleMouseEnter: () => void;
  /** 处理鼠标离开侧边栏。 */
  handleMouseLeave: () => void;
}

/**
 * 管理侧边栏区域状态。
 * @returns 侧边栏显隐、宽度、折叠态与交互控制方法。
 */
export function useSidebarState(): UseSidebarStateReturn {
  /**
   * 布局上下文
   * @description 提供侧栏配置、状态容器与事件分发能力。
   */
  const context = useLayoutContext();
  /**
   * 布局派生状态
   * @description 提供侧栏宽度、显隐等计算结果。
   */
  const layoutComputed = useLayoutComputed();

  /**
   * 侧边栏状态控制器。
   */
  const controller = createLayoutSidebarStateController({
    getState: () => context.state,
    getLayoutComputed: () => layoutComputed.value,
    setState: (patch) => {
      applyStatePatchMutable(context.state, patch);
    },
    onSidebarCollapse: (value) => context.events.onSidebarCollapse?.(value),
  });

  /**
   * 侧边栏状态快照。
   */
  const snapshot = computed(() => controller.getSnapshot());

  /**
   * 侧栏折叠状态双向绑定。
   */
  const collapsed = computed({
    get: () => snapshot.value.collapsed,
    set: (value) => controller.setCollapsed(value),
  });

  /**
   * 悬停展开激活状态双向绑定。
   */
  const expandOnHovering = computed({
    get: () => snapshot.value.expandOnHovering,
    set: (value) => controller.setExpandOnHovering(value),
  });

  /**
   * 侧栏附加区显隐双向绑定。
   */
  const extraVisible = computed({
    get: () => snapshot.value.extraVisible,
    set: (value) => controller.setExtraVisible(value),
  });

  /**
   * 侧栏附加区折叠态双向绑定。
   */
  const extraCollapsed = computed({
    get: () => snapshot.value.extraCollapsed,
    set: (value) => controller.setExtraCollapsed(value),
  });

  /**
   * 是否开启“悬停自动展开”双向绑定。
   */
  const expandOnHover = computed({
    get: () => snapshot.value.expandOnHover,
    set: (value) => controller.setExpandOnHover(value),
  });

  /**
   * 侧栏宽度
   * @description 根据当前布局与折叠状态计算得到。
   */
  const width = computed(() => layoutComputed.value.sidebarWidth);
  /**
   * 侧栏是否可见
   * @description 由布局配置与响应式状态综合决定。
   */
  const visible = computed(() => layoutComputed.value.showSidebar);

  /**
   * 切换侧边栏折叠状态。
   */
  const toggle = () => controller.toggle();
  /**
   * 处理鼠标进入侧边栏事件。
   */
  const handleMouseEnter = () => controller.handleMouseEnter();
  /**
   * 处理鼠标离开侧边栏事件。
   */
  const handleMouseLeave = () => controller.handleMouseLeave();

  return {
    collapsed,
    expandOnHovering,
    extraVisible,
    extraCollapsed,
    expandOnHover,
    width,
    visible,
    layoutComputed,
    toggle,
    handleMouseEnter,
    handleMouseLeave,
  };
}
