import {
  createLayoutResponsiveStateController,
  TIMING,
} from '@admin-core/layout';
import { computed, onMounted, onUnmounted, ref } from 'vue';

export function useResponsive() {
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : TIMING.defaultWindowWidth);
  const controller = createLayoutResponsiveStateController({
    getWidth: () => width.value,
    setWidth: (nextWidth) => {
      width.value = nextWidth;
    },
  });
  const snapshot = computed(() => controller.getSnapshot());

  onMounted(() => {
    controller.start();
  });

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
