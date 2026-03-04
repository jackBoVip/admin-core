/**
 * 标题工具函数。
 * @description 提供路由标题解析与浏览器文档标题拼接能力。
 */

import { resolveMenuByPathIndex, type buildMenuPathIndex } from './menu';
import { getPathWithoutQuery } from './tabs';

/**
 * 根据路径解析菜单标题。
 * @param menuIndex 菜单索引结构。
 * @param path 当前路由路径（可包含查询参数）。
 * @returns 匹配到的菜单标题；未命中时返回空字符串。
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
 * 拼接文档标题。
 * @description 当页面标题与应用名称同时存在时，以「页面标题 - 应用名称」格式输出。
 * @param pageTitle 页面标题。
 * @param appName 应用名称。
 * @returns 规范化后的文档标题字符串。
 */
export function formatDocumentTitle(pageTitle?: string, appName?: string): string {
  if (pageTitle && appName) return `${pageTitle} - ${appName}`;
  return pageTitle || appName || '';
}
