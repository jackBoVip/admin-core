import { resolveWatermarkSnapshot, type WatermarkConfig } from '@admin-core/layout';
import { computed } from 'vue';
import { useLayoutContext } from '../use-layout-context';

/**
 * 解析水印功能配置。
 * @returns 水印启用状态、内容、样式与画布参数。
 */
export function useWatermark() {
  /**
   * 布局上下文
   * @description 提供水印配置来源。
   */
  const context = useLayoutContext();

  /**
   * 水印配置对象。
   */
  const config = computed<WatermarkConfig>(() => context.props.watermark || {});
  /**
   * 水印派生快照。
   */
  const snapshot = computed(() => resolveWatermarkSnapshot(config.value));

  return {
    enabled: computed(() => snapshot.value.enabled),
    content: computed(() => snapshot.value.content),
    style: computed(() => snapshot.value.style),
    config,
    canvasConfig: computed(() => snapshot.value.canvasConfig),
  };
}
