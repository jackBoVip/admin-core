import { createLayoutHeaderStateController } from '@admin-core/layout';
import { computed, onMounted, onUnmounted, watch } from 'vue';
import { useLayoutComputed, useLayoutContext } from '../use-layout-context';

export function useHeaderState() {
  const context = useLayoutContext();
  const layoutComputed = useLayoutComputed();

  const height = computed(() => layoutComputed.value.headerHeight);
  const visible = computed(() => layoutComputed.value.showHeader);

  const controller = createLayoutHeaderStateController({
    getStateHidden: () => context.state.headerHidden,
    getConfigHidden: () => context.props.header?.hidden === true,
    getMode: () => context.props.header?.mode,
    getHeaderHeight: () => height.value,
    setStateHidden: (value) => {
      context.state.headerHidden = value;
    },
  });

  const snapshot = computed(() => controller.getSnapshot());
  const hidden = computed({
    get: () => snapshot.value.hidden,
    set: (value) => {
      controller.setHidden(value);
    },
  });
  const mode = computed(() => snapshot.value.mode);

  onMounted(() => {
    controller.start();
  });

  watch(
    mode,
    () => {
      controller.sync();
    },
    { immediate: true }
  );

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
