/**
 * 水印组件
 * @description 根据偏好设置渲染全局水印，带缓存优化
 */
import React, { memo, useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePreferences } from '../hooks';
import {
  createWatermarkGenerator,
  getWatermarkText,
  type WatermarkConfig,
} from '@admin-core/preferences';

export const Watermark: React.FC = memo(() => {
  const { preferences } = usePreferences();
  const [watermarkDataUrl, setWatermarkDataUrl] = useState('');
  const generatorRef = useRef(createWatermarkGenerator());

  // 使用 useMemo 提取水印配置，避免整个 preferences 变化触发重渲染
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

  // 生成水印文本
  const watermarkText = useMemo(() => getWatermarkText(watermarkConfig), [watermarkConfig]);

  // 生成水印图片（带缓存）
  useEffect(() => {
    const dataUrl = generatorRef.current.getDataUrl(watermarkConfig);
    setWatermarkDataUrl(dataUrl);
  }, [watermarkConfig]);

  // 使用 useMemo 缓存样式对象
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

  if (!watermarkConfig.enabled || !watermarkText || !watermarkStyle) {
    return null;
  }

  return createPortal(
    <div style={watermarkStyle} aria-hidden="true" />,
    document.body
  );
});

Watermark.displayName = 'Watermark';

export default Watermark;
