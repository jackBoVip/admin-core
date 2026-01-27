/**
 * 共享工具函数
 */

/**
 * 判断是否为普通对象
 */
export function isObject(item: unknown): item is Record<string, unknown> {
  return item !== null && typeof item === 'object' && !Array.isArray(item);
}

/**
 * 判断两个值是否相等（深度比较）
 */
export function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => isEqual(item, b[index]));
  }

  if (isObject(a) && isObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    return keysA.every((key) => isEqual(a[key], b[key]));
  }

  return false;
}

/**
 * 判断是否为空对象
 */
export function isEmpty(obj: unknown): boolean {
  if (obj === null || obj === undefined) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (isObject(obj)) return Object.keys(obj).length === 0;
  return false;
}

/**
 * 安全获取嵌套对象属性
 */
export function get<T = unknown>(obj: unknown, path: string, defaultValue?: T): T {
  const keys = path.split('.');
  let result: unknown = obj;

  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue as T;
    }
    result = (result as Record<string, unknown>)[key];
  }

  return (result === undefined ? defaultValue : result) as T;
}
