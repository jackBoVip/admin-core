function isPlainObject(value: unknown): value is Record<string, any> {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function deepClone<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => deepClone(item)) as T;
  }
  if (isPlainObject(value)) {
    const output: Record<string, any> = {};
    for (const [key, item] of Object.entries(value)) {
      output[key] = deepClone(item);
    }
    return output as T;
  }
  return value;
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  return false;
}

export function mergeWithArrayOverride<T extends object>(
  source: Partial<T>,
  target: T
): T {
  const output: Record<string, any> = { ...target };

  for (const [key, sourceValue] of Object.entries(source ?? {})) {
    if (sourceValue === undefined) continue;
    const targetValue = (target as Record<string, any>)[key];

    if (Array.isArray(sourceValue)) {
      output[key] = [...sourceValue];
      continue;
    }

    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      output[key] = mergeWithArrayOverride(sourceValue, targetValue);
      continue;
    }

    output[key] = sourceValue;
  }

  return output as T;
}
