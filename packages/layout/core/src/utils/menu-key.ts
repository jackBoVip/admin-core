/**
 * 菜单 key 相关工具函数
 */

/**
 * 统一的 key 规范化函数
 * @description 将 null/undefined/空字符串 统一视为「无效 key」，其他值转为字符串
 */
export function normalizeMenuKey(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  return String(value);
}
