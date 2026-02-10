/**
 * 图标渲染工具函数
 * @description 统一管理菜单图标的渲染逻辑
 */

import { resolveMenuIconMeta, resolveLayoutIconSize, LAYOUT_ICON_SIZES } from '@admin-core/layout';
import React from 'react';

export type IconSize = Parameters<typeof resolveLayoutIconSize>[0];
// 兼容旧导出
export const ICON_SIZES = LAYOUT_ICON_SIZES;

/**
 * 渲染 SVG 图标
 * @param icon - 图标名称或自定义内容
 * @param size - 图标尺寸（类名或预设）
 * @param className - 额外的类名
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

  // 回退：显示原始内容
  return <span className={mergedClass}>{meta?.raw ?? icon}</span>;
}

/**
 * 渲染带容器的图标
 * @param icon - 图标名称或自定义内容
 * @param containerClassName - 容器类名
 * @param iconSize - 图标尺寸
 * @param fallback - 无图标时的回退内容
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

  // emoji 或自定义内容
  return <span className={containerClassName}>{meta?.raw ?? icon}</span>;
}

/**
 * 创建图标渲染器（用于特定上下文）
 * @param defaultContainerClass - 默认容器类名
 * @param defaultIconSize - 默认图标尺寸
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
