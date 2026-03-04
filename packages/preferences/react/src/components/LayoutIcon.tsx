/**
 * React 布局图标组件。
 * @description 根据布局类型渲染预览图标，并支持选中态样式反馈。
 */

import {
  getLayoutIcon,
  layoutIconTokens,
  borderTokens,
  radiusTokens,
  transitionTokens,
  type LayoutType,
} from '@admin-core/preferences';
import React, { useMemo, useCallback, memo } from 'react';

/**
 * 布局图标组件属性。
 * @description 约束布局类型、尺寸、选中态与点击回调等输入参数。
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
 * 布局图标组件。
 * @description 基于 `memo` 与 `useMemo` 优化渲染，减少图标重复计算。
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
  /**
   * 当前布局对应的 SVG 内容。
   * @description 从核心布局图标工厂读取，随 `layout` 变化更新。
   */
  const svgContent = useMemo(() => getLayoutIcon(layout), [layout]);

  /**
   * 规范化后的宽度值。
   * @description 数字输入自动补齐 `px` 单位，字符串保持原值。
   */
  const widthValue = typeof width === 'number' ? `${width}px` : width;
  /**
   * 规范化后的高度值。
   * @description 数字输入自动补齐 `px` 单位，字符串保持原值。
   */
  const heightValue = typeof height === 'number' ? `${height}px` : height;

  /**
   * 处理布局图标点击事件。
   * @description 将当前布局类型回传给外部点击回调。
   */
  const handleClick = useCallback(() => {
    onClick?.(layout);
  }, [onClick, layout]);

  /**
   * 图标容器最终样式。
   * @description 合并默认尺寸、边框高亮与外部传入样式，输出稳定渲染对象。
   */
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
      className={(() => {
        const classes = ['admin-layout-icon'];
        if (active) classes.push('admin-layout-icon--active');
        if (className) classes.push(className);
        return classes.join(' ');
      })()}
      data-state={active ? 'active' : 'inactive'}
      style={combinedStyle}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
});

/**
 * 默认导出布局预览图标组件。
 */
export default LayoutIcon;
