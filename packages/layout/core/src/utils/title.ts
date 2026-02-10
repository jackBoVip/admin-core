/**
 * 标题工具函数
 */

import { resolveMenuByPathIndex, type buildMenuPathIndex } from './menu';
import { getPathWithoutQuery } from './tabs';

/**
 * 根据路径解析菜单标题
 */
export function resolveMenuTitleByPath(
  menuIndex: ReturnType<typeof buildMenuPathIndex>,
  path: string
): string {
  if (!path) return '';
  const basePath = getPathWithoutQuery(path);
  const menu = resolveMenuByPathIndex(menuIndex, basePath);
  return menu?.name || '';
}

/**
 * 拼接页面标题
 */
export function formatDocumentTitle(pageTitle?: string, appName?: string): string {
  if (pageTitle && appName) return `${pageTitle} - ${appName}`;
  return pageTitle || appName || '';
}
