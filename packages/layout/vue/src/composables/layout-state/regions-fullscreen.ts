import { createLayoutFullscreenStateController, logger } from '@admin-core/layout';
import { onMounted, onUnmounted, ref, type Ref } from 'vue';
import { useLayoutContext } from '../use-layout-context';

/**
 * 全屏切换返回值类型。
 * @description 由控制器 `toggle` 返回值推导，保持与 core 层实现一致。
 */
type FullscreenToggleResult = ReturnType<
  ReturnType<typeof createLayoutFullscreenStateController>['toggle']
>;

/**
 * `useFullscreenState` 返回值。
 */
export interface UseFullscreenStateReturn {
  /** 当前是否处于全屏状态。 */
  isFullscreen: Ref<boolean>;
  /** 触发全屏切换。 */
  toggle: () => FullscreenToggleResult;
}

/**
 * 管理全屏状态与全屏切换行为。
 * @returns 当前全屏状态与切换函数。
 */
export function useFullscreenState(): UseFullscreenStateReturn {
  /**
   * 布局上下文
   * @description 提供全屏状态写入与全屏切换事件分发能力。
   */
  const context = useLayoutContext();
  /**
   * 当前全屏状态。
   */
  const isFullscreen = ref(false);

  /**
   * 同步浏览器全屏状态到本地响应式状态。
   *
   * @param nextValue 最新全屏状态。
   */
  const syncFullscreen = (nextValue: boolean) => {
    if (isFullscreen.value !== nextValue) {
      isFullscreen.value = nextValue;
    }
  };

  /**
   * 全屏状态控制器。
   * @description 封装浏览器全屏 API 与状态同步逻辑。
   */
  const controller = createLayoutFullscreenStateController({
    getIsFullscreen: () => isFullscreen.value,
    setIsFullscreen: (nextValue) => {
      syncFullscreen(nextValue);
    },
    setLayoutFullscreen: (nextValue) => {
      context.state.isFullscreen = nextValue;
    },
    onFullscreenToggle: (nextValue) => {
      context.events.onFullscreenToggle?.(nextValue);
    },
    onError: (error) => {
      logger.error('Fullscreen error:', error);
    },
  });

  /**
   * 切换全屏状态。
   */
  const toggle = () => controller.toggle();

  /**
   * 组件挂载时启动全屏状态监听。
   */
  onMounted(() => {
    controller.start();
  });

  /**
   * 组件卸载时销毁全屏状态监听。
   */
  onUnmounted(() => {
    controller.destroy();
  });

  return {
    isFullscreen,
    toggle,
  };
}
