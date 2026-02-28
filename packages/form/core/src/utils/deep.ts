export { deepClone, deepEqualWithCycles as deepEqual } from '@admin-core/shared-core';

import { isPlainObject, mergeWithArrayOverride as mergeWithArrayOverrideShared } from '@admin-core/shared-core';

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

export function mergeWithArrayOverride<T extends object>(
  source: Partial<T>,
  target: T
): T {
  return mergeWithArrayOverrideShared(source, target, {
    cloneArrays: false,
    trackCircularRefs: true,
  });
}

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

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}

export function isPlainObjectValue(value: unknown): value is Record<string, any> {
  return isPlainObject(value);
}
