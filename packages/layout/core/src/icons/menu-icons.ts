/**
 * 菜单图标工具。
 * @description 统一菜单图标解析逻辑（React/Vue 共用）。
 */

import { getIconMeta, DEFAULT_SVG_VIEWBOX, type IconRenderType } from './base-icons';

/**
 * 菜单图标解析结果。
 */
export interface MenuIconMeta {
  /** 类型。 */
  type: IconRenderType;
  /** 图标视口定义，仅 `svg` 类型有效。 */
  viewBox?: string;
  /** 图标路径，仅 `svg` 类型有效。 */
  path?: string;
  /** 原始图标输入值。 */
  raw?: string;
}

/**
 * 解析菜单图标元信息。
 *
 * @param icon 图标输入值。
 * @returns 解析后的元信息；无法识别时返回 `null`。
 */
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
