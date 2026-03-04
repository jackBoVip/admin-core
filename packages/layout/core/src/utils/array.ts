/**
 * 数组工具函数。
 * @description 提供布局模块内常用的只读数组比较能力。
 */

/**
 * 判断两个数组是否严格相等（顺序敏感）。
 * @param a 第一个数组。
 * @param b 第二个数组。
 * @returns 两个数组长度与同索引元素均相等时返回 `true`。
 */
export function areArraysEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
