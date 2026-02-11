import {
  createLayoutCheckUpdatesRuntime,
  resolveCheckUpdatesEnabled,
} from '@admin-core/layout';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useLayoutContext } from '../use-layout-context';

export function useCheckUpdates(checkFn?: () => Promise<boolean>) {
  const context = useLayoutContext();

  const config = computed(() => context.props.checkUpdates || {});
  const enabled = computed(() => resolveCheckUpdatesEnabled(config.value));
  const hasUpdate = ref(false);
  const runtime = createLayoutCheckUpdatesRuntime({
    getConfig: () => config.value,
    getCheckFn: () => checkFn,
    onUpdate: (result) => {
      hasUpdate.value = result;
    },
  });

  onMounted(() => {
    runtime.start();
  });

  watch(config, () => {
    runtime.sync();
  }, { deep: true });

  watch(enabled, () => {
    runtime.sync();
  });

  onUnmounted(() => {
    runtime.destroy();
  });

  return {
    enabled,
    hasUpdate,
    config,
  };
}
