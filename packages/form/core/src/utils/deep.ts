/**
 * Form Core 深拷贝与合并工具。
 * @description 复用 shared-core 深比较并扩展表单场景下的合并辅助函数。
 */
export { deepClone, deepEqualWithCycles as deepEqual } from '@admin-core/shared-core';

import { isPlainObject, mergeWithArrayOverride as mergeWithArrayOverrideShared } from '@admin-core/shared-core';

/**
 * 对象浅比较。
 * @param a 对象 A。
 * @param b 对象 B。
 * @returns 是否浅相等。
 */
export function shallowEqualObject(
  a: Record<string, any> | undefined,
  b: Record<string, any> | undefined
) {
  if (a === b) return true;
  if (!a || !b) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!Object.is(a[key], b[key])) return false;
  }
  return true;
}

/**
 * 深合并对象，数组按覆盖策略处理。
 * @param source 来源对象。
 * @param target 目标对象。
 * @returns 合并结果。
 */
export function mergeWithArrayOverride<T extends object>(
  source: Partial<T>,
  target: T
): T {
  return mergeWithArrayOverrideShared(source, target, {
    cloneArrays: false,
    trackCircularRefs: true,
  });
}

/**
 * 稳定排序。
 * @param list 待排序列表。
 * @param compare 比较函数。
 * @returns 排序后的新数组。
 */
export function stableSortBy<T>(
  list: readonly T[],
  compare: (a: T, b: T) => number
): T[] {
  return list
    .map((item, index) => ({ index, item }))
    .sort((a, b) => {
      const result = compare(a.item, b.item);
      if (result !== 0) return result;
      return a.index - b.index;
    })
    .map((entry) => entry.item);
}

/**
 * 按键提取对象子集。
 * @param obj 源对象。
 * @param keys 需要提取的键。
 * @returns 子集对象。
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}

/**
 * 判断值是否为普通对象。
 * @param value 待判断值。
 * @returns 是否普通对象。
 */
export function isPlainObjectValue(value: unknown): value is Record<string, any> {
  return isPlainObject(value);
}
