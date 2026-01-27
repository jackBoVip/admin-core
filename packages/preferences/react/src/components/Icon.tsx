/**
 * React Icon 组件
 * @description 将 SVG 字符串渲染为组件
 */

import React, { useMemo, memo } from 'react';
import { getIcon, getIconSize, type IconName, type IconSize } from '@admin-core/preferences';

/**
 * 图标组件属性
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
 * 图标组件 - 使用 memo 优化重渲染
 */
export const Icon = memo<IconProps>(function Icon({
  name,
  size = 'md',
  color = 'currentColor',
  className = '',
  style,
}) {
  const svgContent = useMemo(() => getIcon(name), [name]);
  const sizeValue = useMemo(() => getIconSize(size), [size]);

  const combinedStyle = useMemo<React.CSSProperties>(
    () => ({
      display: 'inline-flex',
      width: `${sizeValue}px`,
      height: `${sizeValue}px`,
      color,
      ...style,
    }),
    [sizeValue, color, style]
  );

  return (
    <span
      className={['admin-icon', className].filter(Boolean).join(' ')}
      style={combinedStyle}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
});

export default Icon;
