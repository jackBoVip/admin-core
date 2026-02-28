export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isFunction<T extends (...args: any[]) => any>(
  value: unknown
): value is T {
  return typeof value === 'function';
}

export function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null;
}

export function isNonArrayObject(value: unknown): value is Record<string, any> {
  return isObject(value) && !Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}
