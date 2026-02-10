/**
 * 数组工具函数
 */

/**
 * 判断两个数组是否严格相等（顺序敏感）
 */
export function areArraysEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
