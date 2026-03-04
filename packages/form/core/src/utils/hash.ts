/**
 * Form Core 哈希工具。
 * @description 提供稳定字符串化与哈希值生成，用于 schema/配置缓存命中。
 */
import { isPlainObject } from '@admin-core/shared-core';

/** 对象到稳定运行时 ID 的映射缓存。 */
const objectIds = new WeakMap<object, number>();
/** 当前已分配到的对象 ID 计数。 */
let objectId = 0;

/**
 * 获取对象的稳定运行时 ID。
 * 同一对象在当前进程内会返回同一个数字 ID。
 *
 * @param value 目标对象。
 * @returns 对象 ID。
 */
function getObjectId(value: object): number {
  const cached = objectIds.get(value);
  if (cached) return cached;
  objectId += 1;
  objectIds.set(value, objectId);
  return objectId;
}

/**
 * 递归序列化任意值为稳定哈希片段。
 *
 * @param value 待哈希值。
 * @param seen 循环引用检测集合。
 * @returns 当前值对应的哈希片段。
 */
function hashValue(value: unknown, seen: WeakSet<object>): string {
  if (value === null) return 'null';
  const valueType = typeof value;
  if (valueType === 'undefined') return 'undefined';
  if (valueType === 'number' || valueType === 'boolean' || valueType === 'bigint') {
    return `${valueType}:${String(value)}`;
  }
  if (valueType === 'string') {
    return `string:${value}`;
  }
  if (valueType === 'symbol') {
    return `symbol:${String(value)}`;
  }
  if (valueType === 'function') {
    return `fn:${getObjectId(value as object)}`;
  }
  if (Array.isArray(value)) {
    return `arr:[${value.map((item) => hashValue(item, seen)).join(',')}]`;
  }
  if (value instanceof Date) {
    return `date:${value.toISOString()}`;
  }
  if (value instanceof RegExp) {
    return `regexp:${value.toString()}`;
  }
  if (isPlainObject(value)) {
    if (seen.has(value)) {
      return `circular:${getObjectId(value)}`;
    }
    seen.add(value);
    const keys = Object.keys(value).sort();
    const content = keys
      .map((key) => `${key}:${hashValue((value as Record<string, unknown>)[key], seen)}`)
      .join(',');
    seen.delete(value);
    return `obj:{${content}}`;
  }
  return `obj:${getObjectId(value as object)}`;
}

/**
 * 对值数组生成稳定哈希字符串。
 *
 * @param values 待哈希值列表。
 * @returns 组合哈希结果。
 */
export function createHash(values: unknown[]): string {
  const seen = new WeakSet<object>();
  return values.map((item) => hashValue(item, seen)).join('|');
}
