/**
 * 对象差异计算工具
 */

import type { DeepPartial } from '../types';
import { isEqual, isObject } from './helpers';

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
 * @returns 差异结果
 */
export function diffWithKeys<T extends object>(
  original: T,
  current: T,
  prefix = ''
): DiffResult<T> {
  const changes: DeepPartial<T> = {};
  const keys: string[] = [];

  for (const key in current) {
    if (!Object.prototype.hasOwnProperty.call(current, key)) continue;

    const fullKey = prefix ? `${prefix}.${key}` : key;
    const originalValue = original[key];
    const currentValue = current[key];

    if (isObject(originalValue) && isObject(currentValue)) {
      const nested = diffWithKeys(originalValue, currentValue, fullKey);
      if (Object.keys(nested.changes).length > 0) {
        (changes as Record<string, unknown>)[key] = nested.changes;
        keys.push(...nested.keys);
      }
    } else if (!isEqual(originalValue, currentValue)) {
      (changes as Record<string, unknown>)[key] = currentValue;
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
 * 检查对象是否有变化
 * @param original - 原始对象
 * @param current - 当前对象
 * @returns 是否有变化
 */
export function hasChanges<T extends object>(original: T, current: T): boolean {
  return diffWithKeys(original, current).keys.length > 0;
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
