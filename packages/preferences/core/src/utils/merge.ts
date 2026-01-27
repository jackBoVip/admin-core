/**
 * 深度合并工具
 */

import type { DeepPartial } from '../types';
import { isObject } from './helpers';

/**
 * 深度合并对象
 * @description 递归合并多个对象，后面的对象优先级更高
 * @param target - 目标对象
 * @param sources - 源对象（可多个）
 * @returns 合并后的对象
 */
export function deepMerge<T extends object>(
  target: T,
  ...sources: DeepPartial<T>[]
): T {
  if (!sources.length) return target;

  const source = sources.shift();
  if (!source) return target;

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key as keyof typeof source];
        const targetValue = target[key as keyof T];

        if (isObject(sourceValue) && isObject(targetValue)) {
          // 递归合并嵌套对象
          (target as Record<string, unknown>)[key] = deepMerge(
            { ...targetValue } as object,
            sourceValue as object
          );
        } else if (sourceValue !== undefined) {
          // 直接覆盖
          (target as Record<string, unknown>)[key] = sourceValue;
        }
      }
    }
  }

  return deepMerge(target, ...sources);
}

/**
 * 深度克隆对象
 * @param obj - 要克隆的对象
 * @returns 克隆后的对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as unknown as T;
  }

  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }

  return cloned;
}

/**
 * 安全的深度合并（不修改原对象）
 * @param target - 目标对象
 * @param sources - 源对象
 * @returns 新的合并对象
 */
export function safeMerge<T extends object>(
  target: T,
  ...sources: DeepPartial<T>[]
): T {
  return deepMerge(deepClone(target), ...sources);
}
