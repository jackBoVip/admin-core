import { createLayoutHeaderStateController } from '@admin-core/layout';
import { computed, onMounted, onUnmounted, watch, type ComputedRef, type WritableComputedRef } from 'vue';
import { useLayoutComputed, useLayoutContext } from '../use-layout-context';

/**
 * 头部模式类型。
 * @description 由头部状态控制器快照推导，保持与 core 层实现一致。
 */
type HeaderMode = ReturnType<
  ReturnType<typeof createLayoutHeaderStateController>['getSnapshot']
>['mode'];

/**
 * `useHeaderState` 返回值。
 */
export interface UseHeaderStateReturn {
  /** 头部是否隐藏（可写计算属性）。 */
  hidden: WritableComputedRef<boolean>;
  /** 头部高度（像素）。 */
  height: ComputedRef<number>;
  /** 头部是否可见。 */
  visible: ComputedRef<boolean>;
  /** 头部运行模式。 */
  mode: ComputedRef<HeaderMode>;
}

/**
 * 管理布局头部区域状态。
 * @returns 头部显隐、模式、高度及状态更新方法。
 */
export function useHeaderState(): UseHeaderStateReturn {
  /**
   * 布局上下文
   * @description 提供头部配置、运行时状态与事件能力。
   */
  const context = useLayoutContext();
  /**
   * 布局派生状态
   * @description 提供头部高度与显隐等计算结果。
   */
  const layoutComputed = useLayoutComputed();

  /**
   * 头部高度。
   */
  const height = computed(() => layoutComputed.value.headerHeight);
  /**
   * 头部是否显示。
   */
  const visible = computed(() => layoutComputed.value.showHeader);

  /**
   * 头部状态控制器。
   */
  const controller = createLayoutHeaderStateController({
    getStateHidden: () => context.state.headerHidden,
    getConfigHidden: () => context.props.header?.hidden === true,
    getMode: () => context.props.header?.mode,
    getHeaderHeight: () => height.value,
    setStateHidden: (value) => {
      context.state.headerHidden = value;
    },
  });

  /**
   * 头部状态快照。
   */
  const snapshot = computed(() => controller.getSnapshot());
  /**
   * 头部隐藏状态双向绑定。
   */
  const hidden = computed({
    get: () => snapshot.value.hidden,
    set: (value) => {
      controller.setHidden(value);
    },
  });
  /**
   * 头部模式。
   */
  const mode = computed(() => snapshot.value.mode);

  /**
   * 挂载时启动头部运行时控制器。
   */
  onMounted(() => {
    controller.start();
  });

  /**
   * 监听头部模式变化并同步控制器状态。
   */
  watch(
    mode,
    () => {
      controller.sync();
    },
    { immediate: true }
  );

  /**
   * 卸载时销毁头部运行时控制器。
   */
  onUnmounted(() => {
    controller.destroy();
  });

  return {
    hidden,
    height,
    visible,
    mode,
  };
}
