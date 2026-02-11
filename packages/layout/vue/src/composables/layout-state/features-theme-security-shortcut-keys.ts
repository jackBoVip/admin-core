import {
  createLayoutShortcutKeyRuntime,
  createShortcutKeydownHandler,
  resolveShortcutEnabled,
} from '@admin-core/layout';
import { computed, onMounted, onUnmounted, watch } from 'vue';
import { useLayoutContext } from '../use-layout-context';

export function useShortcutKeys() {
  const context = useLayoutContext();

  const config = computed(() => context.props.shortcutKeys || {});
  const enabled = computed(() => resolveShortcutEnabled(config.value));

  const handleKeydown = createShortcutKeydownHandler({
    getConfig: () => config.value,
    getHandlers: () => context.events,
  });

  const runtime = createLayoutShortcutKeyRuntime({
    getEnabled: () => enabled.value,
    onKeydown: handleKeydown,
  });

  onMounted(() => {
    runtime.start();
  });

  onUnmounted(() => {
    runtime.destroy();
  });

  watch(enabled, () => {
    runtime.sync();
  });

  return {
    enabled,
    config,
  };
}
