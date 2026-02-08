/**
 * MenuIcon
 * @description 统一菜单图标渲染（基于 core 的 resolveMenuIconMeta）
 */
import { resolveMenuIconMeta, resolveLayoutIconSize } from '@admin-core/layout';

export interface MenuIconProps {
  icon?: string;
  size?: Parameters<typeof resolveLayoutIconSize>[0] | string;
  className?: string;
}

export function MenuIcon({ icon, size = 'md', className }: MenuIconProps) {
  const meta = resolveMenuIconMeta(icon);
  if (!meta) return null;
  const sizeClass = resolveLayoutIconSize(size);
  const mergedClass = className ? `${sizeClass} ${className}` : sizeClass;

  if (meta.type === 'svg') {
    return (
      <svg
        className={mergedClass}
        viewBox={meta.viewBox}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        {meta.path ? <path d={meta.path} /> : null}
      </svg>
    );
  }

  return <span className={mergedClass}>{meta.raw}</span>;
}
