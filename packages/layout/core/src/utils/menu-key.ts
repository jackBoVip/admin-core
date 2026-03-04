/**
 * 菜单 key 相关工具函数。
 * @description 统一菜单标识的标准化逻辑，避免不同来源 key 比较不一致。
 */

/**
 * 统一的 key 规范化函数。
 * @description 将 `null/undefined/空字符串` 统一视为无效 key，其他值统一转为字符串。
 * @param value 原始菜单标识值。
 * @returns 规范化后的菜单 key；无效值返回空字符串。
 */
export function normalizeMenuKey(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  return String(value);
}
