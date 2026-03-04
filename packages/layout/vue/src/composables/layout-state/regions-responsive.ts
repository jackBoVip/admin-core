/**
 * 响应式布局断点工具。
 * @description 监听视口宽度变化并输出移动端/平板/桌面断点状态。
 */
import {
  createLayoutResponsiveStateController,
  TIMING,
} from '@admin-core/layout';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { ComputedRef } from 'vue';

/**
 * 响应式断点快照类型。
 * @description 由响应式状态控制器快照推导，保持与 core 层实现一致。
 */
type ResponsiveSnapshot = ReturnType<
  ReturnType<typeof createLayoutResponsiveStateController>['getSnapshot']
>;

/**
 * `useResponsive` 返回值。
 */
export interface UseResponsiveReturn {
  /** 当前视口宽度。 */
  width: ComputedRef<ResponsiveSnapshot['width']>;
  /** 是否命中移动端断点。 */
  isMobile: ComputedRef<ResponsiveSnapshot['isMobile']>;
  /** 是否命中平板断点。 */
  isTablet: ComputedRef<ResponsiveSnapshot['isTablet']>;
  /** 是否命中桌面端断点。 */
  isDesktop: ComputedRef<ResponsiveSnapshot['isDesktop']>;
  /** 当前断点名称。 */
  breakpoint: ComputedRef<ResponsiveSnapshot['breakpoint']>;
}

/**
 * 监听并返回布局响应式状态。
 * @returns 当前视口宽度、设备断点及断点名称。
 */
export function useResponsive(): UseResponsiveReturn {
  /**
   * 当前窗口宽度。
   */
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : TIMING.defaultWindowWidth);
  /**
   * 响应式状态控制器。
   */
  const controller = createLayoutResponsiveStateController({
    getWidth: () => width.value,
    setWidth: (nextWidth) => {
      width.value = nextWidth;
    },
  });
  /**
   * 当前响应式断点快照。
   */
  const snapshot = computed(() => controller.getSnapshot());

  /**
   * 组件挂载时启动响应式监听。
   */
  onMounted(() => {
    controller.start();
  });

  /**
   * 组件卸载时销毁响应式监听。
   */
  onUnmounted(() => {
    controller.destroy();
  });

  return {
    width: computed(() => snapshot.value.width),
    isMobile: computed(() => snapshot.value.isMobile),
    isTablet: computed(() => snapshot.value.isTablet),
    isDesktop: computed(() => snapshot.value.isDesktop),
    breakpoint: computed(() => snapshot.value.breakpoint),
  };
}
