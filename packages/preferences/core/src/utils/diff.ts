/**
 * 对象差异计算工具。
 * @description 用于比较偏好对象前后状态并输出可持久化的差量。
 */

import { isEqual, isObject } from './helpers';
import type { DeepPartial } from '../types';

/**
 * 差异计算结果。
 */
export interface DiffResult<T> {
  /** 差异对象，仅包含发生变化的字段。 */
  changes: DeepPartial<T>;
  /** 扁平化的变更键路径列表（如 `theme.mode`）。 */
  keys: string[];
}

/**
 * 计算两个对象的差异并同时返回变更键列表。
 * @description 一次遍历即可得到差异对象和键路径，避免多次遍历。
 * @template T 对象类型。
 * @param original 原始对象。
 * @param current 当前对象。
 * @param prefix 键前缀（内部递归使用）。
 * @param detectDeletions 是否检测删除键，默认 `false`。
 * @returns 差异结果对象。
 */
export function diffWithKeys<T extends object>(
  original: T,
  current: T,
  prefix = '',
  detectDeletions = false
): DiffResult<T> {
  const changes = {} as DeepPartial<T>;
  const keys: string[] = [];

  /* 检查 current 中的变化（新增或修改）。 */
  for (const key in current) {
    if (!Object.prototype.hasOwnProperty.call(current, key)) continue;

    const fullKey = prefix ? `${prefix}.${key}` : key;
    const originalValue = original[key];
    const currentValue = current[key];

    if (isObject(originalValue) && isObject(currentValue)) {
      const nested = diffWithKeys(originalValue, currentValue, fullKey, detectDeletions);
      if (Object.keys(nested.changes).length > 0) {
        (changes as Record<string, unknown>)[key] = nested.changes;
        keys.push(...nested.keys);
      }
    } else if (!isEqual(originalValue, currentValue)) {
      (changes as Record<string, unknown>)[key] = currentValue;
      keys.push(fullKey);
    }
  }

  /* 检测删除的键（original 有但 current 没有）。 */
  if (detectDeletions) {
    for (const key in original) {
      if (!Object.prototype.hasOwnProperty.call(original, key)) continue;
      if (Object.prototype.hasOwnProperty.call(current, key)) continue;

      const fullKey = prefix ? `${prefix}.${key}` : key;
      /* 标记为 `undefined` 表示删除。 */
      (changes as Record<string, unknown>)[key] = undefined;
      keys.push(fullKey);
    }
  }

  return { changes, keys };
}

/**
 * 计算两个对象的差异。
 * @description 仅返回 `current` 相对 `original` 的变化部分。
 * @template T 对象类型。
 * @param original 原始对象。
 * @param current 当前对象。
 * @returns 差异对象。
 */
export function diff<T extends object>(original: T, current: T): DeepPartial<T> {
  return diffWithKeys(original, current).changes;
}

/**
 * 判断两个对象是否存在任意差异。
 * @description 发现第一处差异即返回，适合快速脏值判断。
 * @template T 对象类型。
 * @param original 原始对象。
 * @param current 当前对象。
 * @returns 有变化返回 `true`，否则返回 `false`。
 */
export function hasChanges<T extends object>(original: T, current: T): boolean {
  /* 优化：快速检查是否有任何变化，无需计算完整差异。 */
  return hasAnyChange(original, current);
}

/**
 * 快速检查对象是否存在任意变化（内部函数）。
 * @description 用于 `hasChanges`，在首个差异处提前终止递归。
 * @template T 对象类型。
 * @param original 原始对象。
 * @param current 当前对象。
 * @returns 有变化返回 `true`，否则返回 `false`。
 */
function hasAnyChange<T extends object>(original: T, current: T): boolean {
  /* 检查 current 中的变化。 */
  for (const key in current) {
    if (!Object.prototype.hasOwnProperty.call(current, key)) continue;

    const originalValue = original[key];
    const currentValue = current[key];

    if (isObject(originalValue) && isObject(currentValue)) {
      if (hasAnyChange(originalValue, currentValue)) {
        return true;
      }
    } else if (!isEqual(originalValue, currentValue)) {
      return true;
    }
  }

  return false;
}

/**
 * 获取扁平化变更键路径列表。
 * @template T 对象类型。
 * @param original 原始对象。
 * @param current 当前对象。
 * @returns 变化键路径数组。
 */
export function getChangedKeys<T extends object>(original: T, current: T): string[] {
  return diffWithKeys(original, current).keys;
}

/**
 * 从差异对象中提取扁平化变更键路径。
 * @description 当已有 `diff` 结果时可复用，避免重复比较原始对象。
 * @template T 对象类型。
 * @param changes 差异对象。
 * @param prefix 键前缀（内部递归使用）。
 * @returns 变更键路径数组。
 */
export function extractChangedKeys<T extends object>(
  changes: DeepPartial<T>,
  prefix = ''
): string[] {
  const keys: string[] = [];

  for (const key in changes) {
    if (!Object.prototype.hasOwnProperty.call(changes, key)) continue;

    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = changes[key as keyof typeof changes];

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...extractChangedKeys(value as DeepPartial<object>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}
