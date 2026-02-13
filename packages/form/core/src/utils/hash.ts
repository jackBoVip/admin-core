const objectIds = new WeakMap<object, number>();
let objectId = 0;

function getObjectId(value: object): number {
  const cached = objectIds.get(value);
  if (cached) return cached;
  objectId += 1;
  objectIds.set(value, objectId);
  return objectId;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

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

export function createHash(values: unknown[]): string {
  const seen = new WeakSet<object>();
  return values.map((item) => hashValue(item, seen)).join('|');
}
