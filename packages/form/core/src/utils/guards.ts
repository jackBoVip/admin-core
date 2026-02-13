export function isFunction(value: unknown): value is (...args: any[]) => any {
  return typeof value === 'function';
}

export function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null;
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}
