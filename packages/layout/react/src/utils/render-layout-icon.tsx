/**
 * Layout UI 图标渲染工具。
 * @description 根据 core 图标定义渲染 React SVG 节点，并处理尺寸与样式合并。
 */
import {
  getLayoutUiIconDefinition,
  type LayoutUiIconName,
  type IconDefinition,
  resolveLayoutIconSize,
  LAYOUT_ICON_SIZE_PX,
} from '@admin-core/layout';
import React from 'react';

/**
 * 布局图标尺寸参数类型。
 * 支持预设尺寸键或自定义类名。
 */
export type LayoutIconSize = Parameters<typeof resolveLayoutIconSize>[0];

/**
 * 根据图标定义渲染 SVG 节点。
 *
 * @param def 图标定义对象。
 * @param className 需要附加到 `<svg>` 的类名。
 * @param name 图标名称，用于 data 属性标记。
 * @returns 渲染后的 SVG 元素。
 */
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

/**
 * 渲染布局系统图标。
 *
 * @param name 图标名称。
 * @param size 图标尺寸（预设尺寸或类名）。
 * @param className 额外类名。
 * @param style 额外内联样式。
 * @returns 图标节点；未找到图标定义时返回 `null`。
 */
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
