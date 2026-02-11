import { resolveWatermarkSnapshot, type WatermarkConfig } from '@admin-core/layout';
import { useMemo } from 'react';
import { useLayoutContext } from '../use-layout-context';

export function useWatermark() {
  const context = useLayoutContext();

  const config = useMemo<WatermarkConfig>(() => context.props.watermark || {}, [context.props.watermark]);
  const snapshot = useMemo(() => resolveWatermarkSnapshot(config), [config]);

  return {
    enabled: snapshot.enabled,
    content: snapshot.content,
    style: snapshot.style,
    config,
    canvasConfig: snapshot.canvasConfig,
  };
}
