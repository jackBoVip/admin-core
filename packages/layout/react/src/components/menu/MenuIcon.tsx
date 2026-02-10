/**
 * MenuIcon
 * @description 统一菜单图标渲染（基于 core 的 resolveMenuIconMeta）
 */
import { renderIcon } from '../../utils';

export interface MenuIconProps {
  icon?: string;
  size?: Parameters<typeof renderIcon>[1];
  className?: string;
}

export function MenuIcon({ icon, size = 'md', className }: MenuIconProps) {
  return renderIcon(icon, size, className);
}
