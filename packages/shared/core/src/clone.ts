export interface DeepCloneRichOptions {
  cloneError?: boolean;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function cloneErrorInstance(error: Error): Error {
  const clonedError = new (error.constructor as new (message?: string) => Error)(
    error.message
  );
  clonedError.name = error.name;
  if (error.stack) {
    clonedError.stack = error.stack;
  }
  return clonedError;
}

function deepCloneRichInternal<T>(
  value: T,
  seen: WeakMap<object, unknown>,
  options: DeepCloneRichOptions
): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (seen.has(value as object)) {
    return seen.get(value as object) as T;
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as unknown as T;
  }

  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as unknown as T;
  }

  if (options.cloneError && value instanceof Error) {
    return cloneErrorInstance(value) as unknown as T;
  }

  if (value instanceof Map) {
    const clonedMap = new Map();
    seen.set(value as object, clonedMap);
    value.forEach((mapValue, mapKey) => {
      clonedMap.set(
        deepCloneRichInternal(mapKey, seen, options),
        deepCloneRichInternal(mapValue, seen, options)
      );
    });
    return clonedMap as unknown as T;
  }

  if (value instanceof Set) {
    const clonedSet = new Set();
    seen.set(value as object, clonedSet);
    value.forEach((setValue) => {
      clonedSet.add(deepCloneRichInternal(setValue, seen, options));
    });
    return clonedSet as unknown as T;
  }

  if (Array.isArray(value)) {
    const clonedArray: unknown[] = [];
    seen.set(value as object, clonedArray);
    for (const item of value) {
      clonedArray.push(deepCloneRichInternal(item, seen, options));
    }
    return clonedArray as unknown as T;
  }

  const cloned = {} as T;
  seen.set(value as object, cloned);
  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      cloned[key] = deepCloneRichInternal(value[key], seen, options);
    }
  }
  return cloned;
}

export function deepCloneRich<T>(
  value: T,
  seen: WeakMap<object, unknown> = new WeakMap(),
  options: DeepCloneRichOptions = {}
): T {
  return deepCloneRichInternal(value, seen, options);
}

export function containsFunctionRecursively(
  value: unknown,
  seen: WeakSet<object> = new WeakSet()
): boolean {
  if (value === null || typeof value !== 'object') {
    return typeof value === 'function';
  }

  if (seen.has(value)) {
    return false;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      if (containsFunctionRecursively(item, seen)) {
        return true;
      }
    }
    return false;
  }

  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      if (containsFunctionRecursively((value as Record<string, unknown>)[key], seen)) {
        return true;
      }
    }
  }

  return false;
}

export function deepClonePlain<T>(
  value: T,
  seen: WeakMap<object, unknown> = new WeakMap()
): T {
  if (Array.isArray(value)) {
    if (seen.has(value)) {
      return seen.get(value) as T;
    }
    const output: unknown[] = [];
    seen.set(value, output);
    for (const item of value) {
      output.push(deepClonePlain(item, seen));
    }
    return output as T;
  }

  if (isPlainObject(value)) {
    if (seen.has(value)) {
      return seen.get(value) as T;
    }
    const output: Record<string, unknown> = {};
    seen.set(value, output);
    for (const [key, item] of Object.entries(value)) {
      output[key] = deepClonePlain(item, seen);
    }
    return output as T;
  }

  return value;
}
