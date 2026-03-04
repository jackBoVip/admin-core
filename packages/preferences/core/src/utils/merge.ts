/**
 * 深度合并工具。
 * @description 提供深拷贝、可变深合并与不可变安全合并能力。
 */

import { deepCloneRich } from '@admin-core/shared-core';
import { isObject } from './helpers';
import { logger } from './logger';
import type { DeepPartial } from '../types';

/**
 * 判断值是否为数组。
 * @param value 待判断值。
 * @returns 是数组返回 `true`。
 */
function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/** 最大递归深度限制。 */
const MAX_DEPTH = 20;

/**
 * 深度合并对象。
 * @description 递归合并多个对象，后出现的源对象优先级更高；数组按“整体替换”处理。
 * @template T 目标对象类型。
 * @param target 目标对象（会被原位修改）。
 * @param sources 源对象列表。
 * @returns 合并后的目标对象引用。
 */
export function deepMerge<T extends object>(
  target: T,
  ...sources: DeepPartial<T>[]
): T {
  if (!sources.length) return target;

  const source = sources.shift();
  if (!source) return target;

  /**
   * 带循环引用与深度保护的递归合并实现。
   * @param tgt 当前目标对象。
   * @param src 当前源对象。
   * @param seen 已访问对象集合。
   * @param depth 当前递归深度。
   * @returns 无返回值。
   */
  const mergeWithCheck = (
    tgt: Record<string, unknown>,
    src: Record<string, unknown>,
    seen: WeakSet<object>,
    depth: number
  ): void => {
    /* 深度限制检查。 */
    if (depth > MAX_DEPTH) {
      logger.warn('[deepMerge] Maximum recursion depth exceeded');
      return;
    }

    for (const key in src) {
      if (Object.prototype.hasOwnProperty.call(src, key)) {
        const sourceValue = src[key];
        const targetValue = tgt[key];

        /* 数组直接替换，不进行递归合并。 */
        if (isArray(sourceValue)) {
          tgt[key] = [...sourceValue];
        } else if (isObject(sourceValue) && !isArray(sourceValue)) {
          /* 循环引用检测。 */
          if (seen.has(sourceValue as object)) {
            logger.warn('[deepMerge] Circular reference detected, skipping');
            continue;
          }
          seen.add(sourceValue as object);

          if (isObject(targetValue) && !isArray(targetValue)) {
            /* 递归合并嵌套对象。 */
            mergeWithCheck(
              targetValue as Record<string, unknown>,
              sourceValue as Record<string, unknown>,
              seen,
              depth + 1
            );
          } else {
            /* 目标不是对象，直接复制。 */
            tgt[key] = deepClone(sourceValue);
          }
        } else if (sourceValue !== undefined) {
          /* 原始值类型直接覆盖。 */
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
 * 深度克隆对象。
 * @description 支持 `Date`、`RegExp`、`Map`、`Set` 等特殊对象并处理循环引用。
 * @template T 输入值类型。
 * @param obj 要克隆的对象。
 * @param seen 循环引用检测用的 `WeakMap`（内部递归使用）。
 * @returns 克隆后的对象副本。
 */
export function deepClone<T>(obj: T, seen: WeakMap<object, unknown> = new WeakMap()): T {
  return deepCloneRich(obj, seen);
}

/**
 * 安全深度合并（不修改原对象）。
 * @description 先克隆目标对象，再执行深度合并，适合不可变数据场景。
 * @template T 目标对象类型。
 * @param target 目标对象。
 * @param sources 源对象列表。
 * @returns 合并后的新对象。
 */
export function safeMerge<T extends object>(
  target: T,
  ...sources: DeepPartial<T>[]
): T {
  return deepMerge(deepClone(target), ...sources);
}
