/**
 * 深度合并工具
 */

import type { DeepPartial } from '../types';
import { isObject } from './helpers';

/**
 * 检查是否为数组
 */
function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * 检查是否为 Date 对象
 */
function isDate(value: unknown): value is Date {
  return value instanceof Date;
}

/**
 * 检查是否为 RegExp 对象
 */
function isRegExp(value: unknown): value is RegExp {
  return value instanceof RegExp;
}

/**
 * 检查是否为 Map 对象
 */
function isMap(value: unknown): value is Map<unknown, unknown> {
  return value instanceof Map;
}

/**
 * 检查是否为 Set 对象
 */
function isSet(value: unknown): value is Set<unknown> {
  return value instanceof Set;
}

/** 最大递归深度限制 */
const MAX_DEPTH = 20;

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

  // 内部递归函数，带循环引用检测和深度限制
  const mergeWithCheck = (
    tgt: Record<string, unknown>,
    src: Record<string, unknown>,
    seen: WeakSet<object>,
    depth: number
  ): void => {
    // 深度限制检查
    if (depth > MAX_DEPTH) {
      console.warn('[deepMerge] Maximum recursion depth exceeded');
      return;
    }

    for (const key in src) {
      if (Object.prototype.hasOwnProperty.call(src, key)) {
        const sourceValue = src[key];
        const targetValue = tgt[key];

        // 数组直接替换，不进行递归合并
        if (isArray(sourceValue)) {
          tgt[key] = [...sourceValue];
        } else if (isObject(sourceValue) && !isArray(sourceValue)) {
          // 循环引用检测
          if (seen.has(sourceValue as object)) {
            console.warn('[deepMerge] Circular reference detected, skipping');
            continue;
          }
          seen.add(sourceValue as object);

          if (isObject(targetValue) && !isArray(targetValue)) {
            // 递归合并嵌套对象
            mergeWithCheck(
              targetValue as Record<string, unknown>,
              sourceValue as Record<string, unknown>,
              seen,
              depth + 1
            );
          } else {
            // 目标不是对象，直接复制
            tgt[key] = deepClone(sourceValue);
          }
        } else if (sourceValue !== undefined) {
          // 直接覆盖
          tgt[key] = sourceValue;
        }
      }
    }
  };

  if (isObject(target) && isObject(source)) {
    const seen = new WeakSet<object>();
    seen.add(source as object);
    mergeWithCheck(
      target as Record<string, unknown>,
      source as Record<string, unknown>,
      seen,
      0
    );
  }

  return deepMerge(target, ...sources);
}

/**
 * 深度克隆对象
 * @description 支持 Date、RegExp、Map、Set 等特殊对象类型，带循环引用检测
 * @param obj - 要克隆的对象
 * @param seen - 循环引用检测用的 WeakMap（内部使用）
 * @returns 克隆后的对象
 */
export function deepClone<T>(obj: T, seen: WeakMap<object, unknown> = new WeakMap()): T {
  // 基础类型直接返回
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // 循环引用检测
  if (seen.has(obj as object)) {
    const cached = seen.get(obj as object);
    // 确保缓存值存在（理论上 has 为 true 时 get 不会返回 undefined）
    return cached as T;
  }

  // 处理 Date
  if (isDate(obj)) {
    return new Date(obj.getTime()) as unknown as T;
  }

  // 处理 RegExp
  if (isRegExp(obj)) {
    return new RegExp(obj.source, obj.flags) as unknown as T;
  }

  // 处理 Map
  if (isMap(obj)) {
    const clonedMap = new Map();
    seen.set(obj as object, clonedMap);
    obj.forEach((value, key) => {
      clonedMap.set(deepClone(key, seen), deepClone(value, seen));
    });
    return clonedMap as unknown as T;
  }

  // 处理 Set
  if (isSet(obj)) {
    const clonedSet = new Set();
    seen.set(obj as object, clonedSet);
    obj.forEach((value) => {
      clonedSet.add(deepClone(value, seen));
    });
    return clonedSet as unknown as T;
  }

  // 处理数组
  if (Array.isArray(obj)) {
    const clonedArray: unknown[] = [];
    seen.set(obj as object, clonedArray);
    obj.forEach((item, index) => {
      clonedArray[index] = deepClone(item, seen);
    });
    return clonedArray as unknown as T;
  }

  // 处理普通对象
  const cloned = {} as T;
  seen.set(obj as object, cloned);
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key], seen);
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
