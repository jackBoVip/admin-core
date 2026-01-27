/**
 * React 布局图标组件
 * @description 显示布局预览图标
 */

import React, { useMemo, useCallback, memo } from 'react';
import {
  getLayoutIcon,
  layoutIconTokens,
  borderTokens,
  radiusTokens,
  transitionTokens,
  type LayoutType,
} from '@admin-core/preferences';

/**
 * 布局图标组件属性
 */
export interface LayoutIconProps {
  /** 布局类型 */
  layout: LayoutType;
  /** 宽度 */
  width?: number | string;
  /** 高度 */
  height?: number | string;
  /** 是否选中 */
  active?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 点击回调 */
  onClick?: (layout: LayoutType) => void;
}

/**
 * 布局图标组件 - 使用 memo 优化重渲染
 */
export const LayoutIcon = memo<LayoutIconProps>(function LayoutIcon({
  layout,
  width = layoutIconTokens.width,
  height = layoutIconTokens.height,
  active = false,
  className = '',
  style,
  onClick,
}) {
  const svgContent = useMemo(() => getLayoutIcon(layout), [layout]);

  const widthValue = typeof width === 'number' ? `${width}px` : width;
  const heightValue = typeof height === 'number' ? `${height}px` : height;

  const handleClick = useCallback(() => {
    onClick?.(layout);
  }, [onClick, layout]);

  const combinedStyle = useMemo<React.CSSProperties>(
    () => ({
      display: 'inline-flex',
      width: widthValue,
      height: heightValue,
      cursor: 'pointer',
      borderRadius: `var(--radius, ${radiusTokens.defaultPx}px)`,
      border: active
        ? `${borderTokens.activeWidth}px solid var(--primary)`
        : `${borderTokens.activeWidth}px solid transparent`,
      transition: `border-color ${transitionTokens.normal}ms`,
      ...style,
    }),
    [widthValue, heightValue, active, style]
  );

  return (
    <div
      className={['admin-layout-icon', active && 'admin-layout-icon--active', className]
        .filter(Boolean)
        .join(' ')}
      style={combinedStyle}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
});

export default LayoutIcon;
