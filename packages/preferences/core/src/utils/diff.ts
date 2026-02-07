/**
 * 对象差异计算工具
 */

import { isEqual, isObject } from './helpers';
import type { DeepPartial } from '../types';

/**
 * 差异计算结果
 */
export interface DiffResult<T> {
  /** 差异对象 */
  changes: DeepPartial<T>;
  /** 变更的键列表（扁平化） */
  keys: string[];
}

/**
 * 计算两个对象的差异（同时返回差异对象和变更键）
 * @description 一次遍历获取所有差异信息，避免重复计算
 * @param original - 原始对象
 * @param current - 当前对象
 * @param prefix - 键前缀（内部使用）
 * @param detectDeletions - 是否检测删除的键（默认 false，用于偏好设置场景不需要）
 * @returns 差异结果
 */
export function diffWithKeys<T extends object>(
  original: T,
  current: T,
  prefix = '',
  detectDeletions = false
): DiffResult<T> {
  const changes = {} as DeepPartial<T>;
  const keys: string[] = [];

  // 检查 current 中的变化（新增或修改）
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

  // 检测删除的键（original 有但 current 没有）
  if (detectDeletions) {
    for (const key in original) {
      if (!Object.prototype.hasOwnProperty.call(original, key)) continue;
      if (Object.prototype.hasOwnProperty.call(current, key)) continue;

      const fullKey = prefix ? `${prefix}.${key}` : key;
      // 标记为 undefined 表示删除
      (changes as Record<string, unknown>)[key] = undefined;
      keys.push(fullKey);
    }
  }

  return { changes, keys };
}

/**
 * 计算两个对象的差异
 * @description 返回 current 相对于 original 的变化部分
 * @param original - 原始对象
 * @param current - 当前对象
 * @returns 差异对象（只包含变化的部分）
 */
export function diff<T extends object>(original: T, current: T): DeepPartial<T> {
  return diffWithKeys(original, current).changes;
}

/**
 * 检查对象是否有变化（优化版：发现第一个差异即返回）
 * @param original - 原始对象
 * @param current - 当前对象
 * @returns 是否有变化
 */
export function hasChanges<T extends object>(original: T, current: T): boolean {
  // 优化：快速检查是否有任何变化，无需计算完整差异
  return hasAnyChange(original, current);
}

/**
 * 快速检查是否有任何变化（内部使用）
 * @description 发现第一个差异即返回，比 diffWithKeys 更高效
 */
function hasAnyChange<T extends object>(original: T, current: T): boolean {
  // 检查 current 中的变化
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
 * 获取变化的键列表（扁平化）
 * @param original - 原始对象
 * @param current - 当前对象
 * @returns 变化的键列表
 */
export function getChangedKeys<T extends object>(original: T, current: T): string[] {
  return diffWithKeys(original, current).keys;
}

/**
 * 从差异对象中提取变更键列表
 * @description 用于已有 diff 结果时，无需重新计算
 * @param changes - 差异对象
 * @param prefix - 键前缀
 * @returns 变更的键列表
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
