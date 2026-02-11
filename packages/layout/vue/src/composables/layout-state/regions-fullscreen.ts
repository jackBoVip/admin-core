import { createLayoutFullscreenStateController, logger } from '@admin-core/layout';
import { onMounted, onUnmounted, ref } from 'vue';
import { useLayoutContext } from '../use-layout-context';

export function useFullscreenState() {
  const context = useLayoutContext();
  const isFullscreen = ref(false);

  const syncFullscreen = (nextValue: boolean) => {
    if (isFullscreen.value !== nextValue) {
      isFullscreen.value = nextValue;
    }
  };

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

  const toggle = () => controller.toggle();

  onMounted(() => {
    controller.start();
  });

  onUnmounted(() => {
    controller.destroy();
  });

  return {
    isFullscreen,
    toggle,
  };
}
