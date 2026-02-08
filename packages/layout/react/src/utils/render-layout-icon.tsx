/**
 * Layout UI 图标渲染工具
 */
import React from 'react';
import {
  getLayoutUiIconDefinition,
  type LayoutUiIconName,
  type IconDefinition,
  resolveLayoutIconSize,
} from '@admin-core/layout';

export type LayoutIconSize = Parameters<typeof resolveLayoutIconSize>[0];

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
      {def.path ? <path d={def.path} /> : null}
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
  const sizeClass = resolveLayoutIconSize(size);
  const mergedClass = className ? `${sizeClass} ${className}` : sizeClass;
  const svg = renderSvg(def, mergedClass);
  if (!style) return svg;
  return React.cloneElement(
    svg as React.ReactElement<React.SVGProps<SVGSVGElement>>,
    { style }
  );
}
