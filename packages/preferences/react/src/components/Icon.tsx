/**
 * React 图标组件。
 * @description 将图标名解析为 SVG 字符串并渲染为可复用组件。
 */

import { getIcon, getIconSize, type IconName, type IconSize } from '@admin-core/preferences';
import React, { useMemo, memo } from 'react';

/**
 * 图标组件属性。
 * @description 定义图标名称、尺寸、颜色与样式扩展参数。
 */
export interface IconProps {
  /** 图标名称 */
  name: IconName;
  /** 图标尺寸 */
  size?: IconSize | number;
  /** 自定义颜色 */
  color?: string;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

/**
 * 图标组件。
 * @description 基于 `memo` 与 `useMemo` 优化渲染，降低重复计算开销。
 */
export const Icon = memo<IconProps>(function Icon({
  name,
  size = 'md',
  color = 'currentColor',
  className = '',
  style,
}) {
  /**
   * SVG 字符串内容。
   * @description 根据图标名称从核心图标注册表读取并缓存。
   */
  const svgContent = useMemo(() => getIcon(name), [name]);
  /**
   * 规范化后的图标尺寸。
   * @description 支持数字与预设尺寸混用，最终统一为像素值。
   */
  const sizeValue = useMemo(() => getIconSize(size), [size]);

  /**
   * 图标最终样式对象。
   * @description 合并组件内置布局样式与外部透传样式，确保外部可覆盖默认行为。
   */
  const combinedStyle = useMemo<React.CSSProperties>(
    () => ({
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: `${sizeValue}px`,
      height: `${sizeValue}px`,
      color,
      ...style,
    }),
    [sizeValue, color, style]
  );

  return (
    <span
      className={className ? `admin-icon ${className}` : 'admin-icon'}
      style={combinedStyle}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
});

/**
 * 默认导出图标组件。
 */
export default Icon;
