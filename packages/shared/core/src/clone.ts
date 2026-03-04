/**
 * Shared Core 深拷贝工具。
 * @description 提供富类型深拷贝、函数检测与轻量对象数组拷贝能力。
 */
/**
 * 深拷贝增强选项。
 */
export interface DeepCloneRichOptions {
  /** 是否深拷贝 Error 对象（默认 `false`）。 */
  cloneError?: boolean;
}

/**
 * 判断值是否为普通对象。
 * @param value 待判断值。
 * @returns 是否普通对象。
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * 克隆 Error 实例。
 * @param error 原始错误对象。
 * @returns 克隆后的错误对象。
 */
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

/**
 * 深拷贝内部实现（支持循环引用、Map/Set/Date/RegExp）。
 * @param value 待拷贝值。
 * @param seen 循环引用跟踪表。
 * @param options 拷贝选项。
 * @returns 深拷贝结果。
 */
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

/**
 * 深拷贝增强版入口。
 * @template T 值类型。
 * @param value 待拷贝值。
 * @param seen 循环引用跟踪表。
 * @param options 拷贝选项。
 * @returns 深拷贝结果。
 */
export function deepCloneRich<T>(
  value: T,
  seen: WeakMap<object, unknown> = new WeakMap(),
  options: DeepCloneRichOptions = {}
): T {
  return deepCloneRichInternal(value, seen, options);
}

/**
 * 递归检测值中是否包含函数。
 * @param value 待检测值。
 * @param seen 循环引用跟踪集合。
 * @returns 是否包含函数。
 */
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

/**
 * 仅针对数组与普通对象的轻量深拷贝。
 * @template T 值类型。
 * @param value 待拷贝值。
 * @param seen 循环引用跟踪表。
 * @returns 深拷贝结果。
 */
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
