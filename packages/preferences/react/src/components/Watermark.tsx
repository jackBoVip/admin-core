/**
 * 水印组件
 * @description 根据偏好设置渲染全局水印，带缓存优化
 */
import {
  createWatermarkGenerator,
  getWatermarkText,
  type WatermarkConfig,
} from '@admin-core/preferences';
import React, { memo, useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePreferences } from '../hooks';

/**
 * 全局水印组件。
 */
export const Watermark: React.FC = memo(() => {
  /**
   * 偏好设置快照。
   * @description 读取水印开关与文案相关配置。
   */
  const { preferences } = usePreferences();
  /**
   * 水印图像 Data URL。
   * @description 缓存生成器输出的图片数据，作为覆盖层背景图使用。
   */
  const [watermarkDataUrl, setWatermarkDataUrl] = useState('');
  /**
   * 水印生成器实例引用。
   * @description 复用同一生成器以利用内部缓存能力，减少重复绘制。
   */
  const generatorRef = useRef(createWatermarkGenerator());
  /**
   * Portal 挂载目标节点。
   * @description 浏览器环境下挂载到 `document.body`，确保水印覆盖全页面。
   */
  const portalTarget = typeof document === 'undefined' ? null : document.body;

  /**
   * 提取水印配置对象。
   * @description 仅订阅与水印相关的偏好字段，减少无关配置变更导致的重算。
   */
  const watermarkConfig = useMemo<WatermarkConfig>(() => ({
    enabled: preferences.app.watermark,
    content: preferences.app.watermarkContent || '',
    angle: preferences.app.watermarkAngle ?? -22,
    appendDate: preferences.app.watermarkAppendDate ?? false,
    fontSize: preferences.app.watermarkFontSize ?? 16,
  }), [
    preferences.app.watermark,
    preferences.app.watermarkContent,
    preferences.app.watermarkAngle,
    preferences.app.watermarkAppendDate,
    preferences.app.watermarkFontSize,
  ]);

  /**
   * 计算最终水印文案。
   * @description 统一复用 core 规则处理日期拼接等逻辑。
   */
  const watermarkText = useMemo(() => getWatermarkText(watermarkConfig), [watermarkConfig]);

  /**
   * 生成水印图片 Data URL。
   * @description 通过内部生成器缓存相同配置，降低重复绘制开销。
   */
  useEffect(() => {
    const dataUrl = generatorRef.current.getDataUrl(watermarkConfig);
    setWatermarkDataUrl(dataUrl);
  }, [watermarkConfig]);

  /**
   * 构建覆盖层样式对象。
   * @description 样式对象稳定可减少 React diff 时的无效引用变化。
   */
  const watermarkStyle = useMemo<React.CSSProperties | null>(() => {
    if (!watermarkDataUrl) return null;
    return {
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      pointerEvents: 'none',
      userSelect: 'none',
      backgroundImage: `url(${watermarkDataUrl})`,
      backgroundRepeat: 'repeat',
    };
  }, [watermarkDataUrl]);

  if (!watermarkConfig.enabled || !watermarkText || !watermarkStyle || !portalTarget) {
    return null;
  }

  return createPortal(
    <div style={watermarkStyle} aria-hidden="true" />,
    portalTarget
  );
});

Watermark.displayName = 'Watermark';

/**
 * 默认导出水印组件。
 */
export default Watermark;
