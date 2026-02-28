/**
 * 深度合并工具
 */

import { deepCloneRich } from '@admin-core/shared-core';
import { isObject } from './helpers';
import { logger } from './logger';
import type { DeepPartial } from '../types';

/**
 * 检查是否为数组
 */
function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
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
      logger.warn('[deepMerge] Maximum recursion depth exceeded');
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
            logger.warn('[deepMerge] Circular reference detected, skipping');
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
  return deepCloneRich(obj, seen);
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
