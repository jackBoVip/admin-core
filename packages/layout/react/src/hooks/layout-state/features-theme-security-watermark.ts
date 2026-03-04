import { resolveWatermarkSnapshot, type WatermarkConfig } from '@admin-core/layout';
import { useMemo } from 'react';
import { useLayoutContext } from '../use-layout-context';

/**
 * 解析水印功能配置。
 * @description 将输入配置标准化为可直接渲染的水印快照与画布参数。
 * @returns 水印启用状态、内容、样式与画布参数。
 */
export function useWatermark() {
  const context = useLayoutContext();

  /**
   * 水印配置对象。
   */
  const config = useMemo<WatermarkConfig>(() => context.props.watermark || {}, [context.props.watermark]);
  /**
   * 水印派生快照。
   */
  const snapshot = useMemo(() => resolveWatermarkSnapshot(config), [config]);

  return {
    enabled: snapshot.enabled,
    content: snapshot.content,
    style: snapshot.style,
    config,
    canvasConfig: snapshot.canvasConfig,
  };
}
