/**
 * Layout UI 图标渲染工具
 */
import {
  getLayoutUiIconDefinition,
  type LayoutUiIconName,
  type IconDefinition,
  resolveLayoutIconSize,
  LAYOUT_ICON_SIZE_PX,
} from '@admin-core/layout';
import React from 'react';

export type LayoutIconSize = Parameters<typeof resolveLayoutIconSize>[0];

function renderSvg(def: IconDefinition, className: string, name?: string) {
  const fill = def.fill ? 'currentColor' : 'none';
  const stroke = def.fill ? 'none' : 'currentColor';
  const hasOpticalScale = typeof def.opticalScale === 'number' && def.opticalScale !== 1;
  const transform = hasOpticalScale
    ? `translate(12 12) scale(${def.opticalScale}) translate(-12 -12)`
    : undefined;
  const content = (
    <>
      {def.extra ? (
        <g dangerouslySetInnerHTML={{ __html: def.extra }} />
      ) : null}
      {def.path ? <path d={def.path} /> : null}
    </>
  );
  return (
    <svg
      className={className}
      viewBox={def.viewBox}
      fill={fill}
      stroke={stroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      data-icon={name}
    >
      {transform ? <g transform={transform}>{content}</g> : content}
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
  const svg = renderSvg(def, mergedClass, name);
  const sizeStyle =
    typeof size === 'string' && size in LAYOUT_ICON_SIZE_PX
      ? { width: `${LAYOUT_ICON_SIZE_PX[size as keyof typeof LAYOUT_ICON_SIZE_PX]}px`, height: `${LAYOUT_ICON_SIZE_PX[size as keyof typeof LAYOUT_ICON_SIZE_PX]}px` }
      : undefined;
  const mergedStyle = sizeStyle ? { ...sizeStyle, ...style } : style;
  if (!mergedStyle) return svg;
  return React.cloneElement(
    svg as React.ReactElement<React.SVGProps<SVGSVGElement>>,
    { style: mergedStyle }
  );
}
