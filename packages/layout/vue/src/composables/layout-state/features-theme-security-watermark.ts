import { resolveWatermarkSnapshot, type WatermarkConfig } from '@admin-core/layout';
import { computed } from 'vue';
import { useLayoutContext } from '../use-layout-context';

export function useWatermark() {
  const context = useLayoutContext();

  const config = computed<WatermarkConfig>(() => context.props.watermark || {});
  const snapshot = computed(() => resolveWatermarkSnapshot(config.value));

  return {
    enabled: computed(() => snapshot.value.enabled),
    content: computed(() => snapshot.value.content),
    style: computed(() => snapshot.value.style),
    config,
    canvasConfig: computed(() => snapshot.value.canvasConfig),
  };
}
