/**
 * 水印组件
 * @description 根据偏好设置渲染全局水印，带缓存优化
 */
import React, { memo, useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePreferences } from '../hooks';

// 全局缓存（避免重复生成相同配置的水印）
const watermarkCache = new Map<string, string>();

export const Watermark: React.FC = memo(() => {
  const { preferences } = usePreferences();
  const [watermarkDataUrl, setWatermarkDataUrl] = useState('');
  
  // 复用 canvas 元素
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 使用 useMemo 提取水印配置，避免整个 preferences 变化触发重渲染
  const watermarkConfig = useMemo(() => ({
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
  const watermarkText = useMemo(() => {
    const { content, appendDate } = watermarkConfig;
    if (!content) return '';
    
    if (appendDate) {
      const date = new Date();
      const dateStr = date.toLocaleDateString();
      return `${content} ${dateStr}`;
    }
    
    return content;
  }, [watermarkConfig]);

  // 生成配置的缓存 key
  const cacheKey = useMemo(() => {
    const { enabled, angle, fontSize } = watermarkConfig;
    if (!enabled || !watermarkText) return '';
    return `${watermarkText}|${angle}|${fontSize}`;
  }, [watermarkConfig, watermarkText]);

  // 生成水印图片（带缓存）
  useEffect(() => {
    if (!cacheKey) {
      setWatermarkDataUrl('');
      return;
    }

    // SSR 环境检查
    if (typeof document === 'undefined') return;

    // 检查缓存
    const cached = watermarkCache.get(cacheKey);
    if (cached) {
      setWatermarkDataUrl(cached);
      return;
    }

    // 复用 canvas 元素
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { angle, fontSize } = watermarkConfig;
    const text = watermarkText;
    const angleRad = (angle * Math.PI) / 180;

    // 设置字体来测量文本
    ctx.font = `${fontSize}px sans-serif`;
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize * 1.2;

    // 计算旋转后的边界框
    const cos = Math.abs(Math.cos(angleRad));
    const sin = Math.abs(Math.sin(angleRad));
    const rotatedWidth = textWidth * cos + textHeight * sin;
    const rotatedHeight = textWidth * sin + textHeight * cos;

    // 设置 canvas 尺寸（添加间距）
    const padding = 80;
    canvas.width = rotatedWidth + padding;
    canvas.height = rotatedHeight + padding;

    // 清除并设置透明背景
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 移动到中心并旋转
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angleRad);

    // 绘制水印文本
    ctx.font = `${fontSize}px sans-serif`;
    ctx.fillStyle = 'rgba(128, 128, 128, 0.15)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 0);
    ctx.restore();

    const dataUrl = canvas.toDataURL('image/png');
    
    // 存入缓存（限制缓存大小）
    if (watermarkCache.size > 10) {
      const firstKey = watermarkCache.keys().next().value;
      if (firstKey) watermarkCache.delete(firstKey);
    }
    watermarkCache.set(cacheKey, dataUrl);
    
    setWatermarkDataUrl(dataUrl);
  }, [cacheKey]); // 只依赖 cacheKey，它已包含所有必要信息

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
