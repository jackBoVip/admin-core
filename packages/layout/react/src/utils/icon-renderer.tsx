/**
 * 图标渲染工具函数。
 * @description 统一管理菜单图标在 React 侧的解析与渲染逻辑。
 */

import { resolveMenuIconMeta, resolveLayoutIconSize, LAYOUT_ICON_SIZES } from '@admin-core/layout';
import React from 'react';

/**
 * 图标尺寸参数类型别名。
 * @description 与 core 的 `resolveLayoutIconSize` 入参保持一致。
 */
export type IconSize = Parameters<typeof resolveLayoutIconSize>[0];
/**
 * 布局图标尺寸映射表（透传 core 常量）。
 * @description 保留历史导出名称，兼容旧版调用方。
 */
export const ICON_SIZES = LAYOUT_ICON_SIZES;

/**
 * 渲染图标节点。
 * @description 支持内置 SVG、表情图标与自定义文本图标渲染。
 * @param icon 图标名称或自定义内容。
 * @param size 图标尺寸（类名或预设）。
 * @param className 额外类名。
 * @returns 渲染后的图标节点；无图标时返回 `null`。
 */
export function renderIcon(
  icon: string | undefined,
  size: IconSize | string = 'md',
  className?: string
): React.ReactNode {
  if (!icon) return null;

  const meta = resolveMenuIconMeta(icon);
  const type = meta?.type;
  const sizeClass = resolveLayoutIconSize(size);
  const mergedClass = className ? `${sizeClass} ${className}` : sizeClass;

  if (type === 'emoji' || type === 'custom') {
    return <span className={mergedClass}>{meta?.raw ?? icon}</span>;
  }

  if (type === 'svg') {
    if (meta?.path) {
      return (
        <svg
          className={mergedClass}
          viewBox={meta.viewBox}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d={meta.path} />
        </svg>
      );
    }
  }

  /** 回退渲染：直接显示原始图标文本或原始元数据。 */
  return <span className={mergedClass}>{meta?.raw ?? icon}</span>;
}

/**
 * 渲染带容器的图标。
 * @description 在图标外包裹容器节点，便于统一布局与样式控制。
 * @param icon 图标名称或自定义内容。
 * @param containerClassName 容器类名。
 * @param iconSize 图标尺寸。
 * @param fallback 无图标时的回退内容。
 * @returns 渲染后的节点；无图标且无回退时返回 `null`。
 */
export function renderIconWithContainer(
  icon: string | undefined,
  containerClassName: string,
  iconSize: IconSize | string = 'md',
  fallback?: React.ReactNode
): React.ReactNode {
  if (!icon && fallback) {
    return <span className={containerClassName}>{fallback}</span>;
  }

  if (!icon) return null;

  const meta = resolveMenuIconMeta(icon);
  const type = meta?.type;
  const sizeClass = resolveLayoutIconSize(iconSize);

  if (type === 'svg') {
    if (meta?.path) {
      return (
        <span className={containerClassName}>
          <svg
            className={sizeClass}
            viewBox={meta.viewBox}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d={meta.path} />
          </svg>
        </span>
      );
    }
  }

  /** 表情符号或自定义内容统一走文本容器渲染。 */
  return <span className={containerClassName}>{meta?.raw ?? icon}</span>;
}

/**
 * 创建图标渲染器（用于特定上下文）。
 * @description 预设默认容器类名与尺寸，返回可复用的渲染函数。
 * @param defaultContainerClass 默认容器类名。
 * @param defaultIconSize 默认图标尺寸。
 * @returns 图标渲染函数。
 */
export function createIconRenderer(
  defaultContainerClass: string,
  defaultIconSize: IconSize | string = 'md'
) {
  return (
    icon: string | undefined,
    fallback?: React.ReactNode,
    overrideContainerClass?: string,
    overrideIconSize?: IconSize | string
  ): React.ReactNode => {
    return renderIconWithContainer(
      icon,
      overrideContainerClass || defaultContainerClass,
      overrideIconSize || defaultIconSize,
      fallback
    );
  };
}
