/**
 * Layout UI 图标渲染工具
 */
import React from 'react';
import {
  getLayoutUiIconDefinition,
  type LayoutUiIconName,
  type IconDefinition,
} from '@admin-core/layout';

const LAYOUT_ICON_SIZES = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-[1.125rem] w-[1.125rem]',
  lg: 'h-5 w-5',
  xl: 'h-6 w-6',
} as const;

export type LayoutIconSize = keyof typeof LAYOUT_ICON_SIZES;

function renderSvg(def: IconDefinition, className: string) {
  const fill = def.fill ? 'currentColor' : 'none';
  const stroke = def.fill ? 'none' : 'currentColor';
  return (
    <svg
      className={className}
      viewBox={def.viewBox}
      fill={fill}
      stroke={stroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {def.extra ? (
        <g dangerouslySetInnerHTML={{ __html: def.extra }} />
      ) : null}
      <path d={def.path} />
    </svg>
  );
}

export function renderLayoutIcon(
  name: LayoutUiIconName,
  size: LayoutIconSize | string = 'md',
  className?: string,
  style?: React.CSSProperties
) {
  const def = getLayoutUiIconDefinition(name);
  if (!def) return null;
  const sizeClass = size in LAYOUT_ICON_SIZES ? LAYOUT_ICON_SIZES[size as LayoutIconSize] : size;
  const mergedClass = className ? `${sizeClass} ${className}` : sizeClass;
  const svg = renderSvg(def, mergedClass);
  if (!style) return svg;
  return React.cloneElement(
    svg as React.ReactElement<React.SVGProps<SVGSVGElement>>,
    { style }
  );
}
