/**
 * 图标渲染工具函数
 * @description 统一管理菜单图标的渲染逻辑
 */

import React from 'react';
import { getIconDefinition, getIconRenderType } from '@admin-core/layout';

/**
 * 图标尺寸预设
 */
export const ICON_SIZES = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-[1.125rem] w-[1.125rem]',
  lg: 'h-5 w-5',
  xl: 'h-6 w-6',
} as const;

export type IconSize = keyof typeof ICON_SIZES;

const iconMetaCache = new Map<string, { type: ReturnType<typeof getIconRenderType>; def?: ReturnType<typeof getIconDefinition> }>();

const getIconMeta = (icon: string | undefined) => {
  if (!icon) return null;
  const cached = iconMetaCache.get(icon);
  if (cached) return cached;
  const type = getIconRenderType(icon);
  const def = type === 'svg' ? getIconDefinition(icon) : undefined;
  const meta = { type, def };
  iconMetaCache.set(icon, meta);
  return meta;
};

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

  const meta = getIconMeta(icon);
  const type = meta?.type;
  const sizeClass = size in ICON_SIZES ? ICON_SIZES[size as IconSize] : size;

  if (type === 'emoji' || type === 'custom') {
    return <span className={className}>{icon}</span>;
  }

  if (type === 'svg') {
    const svgDef = meta?.def;
    if (svgDef) {
      return (
        <svg
          className={`${sizeClass}${className ? ` ${className}` : ''}`}
          viewBox={svgDef.viewBox}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d={svgDef.path} />
        </svg>
      );
    }
  }

  // 回退：显示原始内容
  return <span className={className}>{icon}</span>;
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

  const meta = getIconMeta(icon);
  const type = meta?.type;
  const sizeClass = iconSize in ICON_SIZES ? ICON_SIZES[iconSize as IconSize] : iconSize;

  if (type === 'svg') {
    const svgDef = meta?.def;
    if (svgDef) {
      return (
        <span className={containerClassName}>
          <svg
            className={sizeClass}
            viewBox={svgDef.viewBox}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d={svgDef.path} />
          </svg>
        </span>
      );
    }
  }

  // emoji 或自定义内容
  return <span className={containerClassName}>{icon}</span>;
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
