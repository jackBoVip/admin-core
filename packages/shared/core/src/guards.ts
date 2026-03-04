/**
 * Shared Core 类型守卫工具。
 * @description 封装常用运行时类型判断，减少跨包重复实现。
 */
/**
 * 判断值是否为布尔类型。
 * @param value 待判断值。
 * @returns 是否布尔值。
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * 判断值是否为函数。
 * @param value 待判断值。
 * @returns 是否函数。
 */
export function isFunction<T extends (...args: any[]) => any>(
  value: unknown
): value is T {
  return typeof value === 'function';
}

/**
 * 判断值是否为对象（排除 `null`）。
 * @param value 待判断值。
 * @returns 是否对象。
 */
export function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null;
}

/**
 * 判断值是否为非数组对象。
 * @param value 待判断值。
 * @returns 是否为非数组对象。
 */
export function isNonArrayObject(value: unknown): value is Record<string, any> {
  return isObject(value) && !Array.isArray(value);
}

/**
 * 判断值是否为字符串。
 * @param value 待判断值。
 * @returns 是否字符串。
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}
