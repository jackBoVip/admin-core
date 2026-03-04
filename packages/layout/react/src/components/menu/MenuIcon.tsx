/**
 * 菜单图标组件。
 * @description 基于 core 图标解析能力统一渲染菜单图标，兼容多种图标来源。
 */
import { renderIcon } from '../../utils';

/**
 * 菜单图标组件参数。
 * @description 定义菜单图标渲染时的图标标识、尺寸与样式类名。
 */
export interface MenuIconProps {
  /** 菜单图标标识，可传入内置 key、组件名或图标地址。 */
  icon?: string;
  /** 图标尺寸档位，复用 `renderIcon` 的尺寸参数类型。 */
  size?: Parameters<typeof renderIcon>[1];
  /** 样式类名。 */
  className?: string;
}

/**
 * 渲染菜单图标。
 * @param props 菜单图标参数。
 * @returns 渲染后的图标节点。
 */
export function MenuIcon({ icon, size = 'md', className }: MenuIconProps) {
  return renderIcon(icon, size, className);
}
