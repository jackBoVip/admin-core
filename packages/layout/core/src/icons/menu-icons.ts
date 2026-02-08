/**
 * Menu icon helpers
 * @description 统一菜单图标解析逻辑（React/Vue 共用）
 */

import { getIconMeta, DEFAULT_SVG_VIEWBOX, type IconRenderType } from './base-icons';

export interface MenuIconMeta {
  type: IconRenderType;
  viewBox?: string;
  path?: string;
  raw?: string;
}

export function resolveMenuIconMeta(icon?: string | null): MenuIconMeta | null {
  if (!icon) return null;
  const meta = getIconMeta(icon);
  if (!meta) return null;

  if (meta.type === 'svg') {
    return {
      type: 'svg',
      viewBox: meta.def?.viewBox || DEFAULT_SVG_VIEWBOX,
      path: meta.def?.path || '',
      raw: icon,
    };
  }

  return {
    type: meta.type,
    raw: icon,
  };
}
