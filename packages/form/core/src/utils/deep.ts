function isPlainObject(value: unknown): value is Record<string, any> {
  return (
    typeof value === 'object' &&
    value !== null &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null)
  );
}

export function deepClone<T>(input: T): T {
  const seen = new WeakMap<object, any>();
  const clone = (value: any): any => {
    if (Array.isArray(value)) {
      if (seen.has(value)) {
        return seen.get(value);
      }
      const output: any[] = [];
      seen.set(value, output);
      for (const item of value) {
        output.push(clone(item));
      }
      return output;
    }
    if (isPlainObject(value)) {
      if (seen.has(value)) {
        return seen.get(value);
      }
      const output: Record<string, any> = {};
      seen.set(value, output);
      for (const [key, item] of Object.entries(value)) {
        output[key] = clone(item);
      }
      return output;
    }
    return value;
  };
  return clone(input) as T;
}

export function shallowEqualObject(
  a: Record<string, any> | undefined,
  b: Record<string, any> | undefined
) {
  if (a === b) return true;
  if (!a || !b) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!Object.is(a[key], b[key])) return false;
  }
  return true;
}

function markComparedPair(
  a: object,
  b: object,
  seen: WeakMap<object, WeakSet<object>>
) {
  let set = seen.get(a);
  if (!set) {
    set = new WeakSet<object>();
    seen.set(a, set);
  }
  if (set.has(b)) {
    return true;
  }
  set.add(b);
  return false;
}

export function deepEqual(a: any, b: any): boolean {
  const seen = new WeakMap<object, WeakSet<object>>();
  const compare = (left: any, right: any): boolean => {
    if (Object.is(left, right)) return true;
    if (typeof left !== typeof right) return false;

    if (Array.isArray(left) && Array.isArray(right)) {
      if (markComparedPair(left, right, seen)) {
        return true;
      }
      if (left.length !== right.length) return false;
      for (let index = 0; index < left.length; index += 1) {
        if (!compare(left[index], right[index])) return false;
      }
      return true;
    }

    if (isPlainObject(left) && isPlainObject(right)) {
      if (markComparedPair(left, right, seen)) {
        return true;
      }
      const leftKeys = Object.keys(left);
      const rightKeys = Object.keys(right);
      if (leftKeys.length !== rightKeys.length) return false;
      for (const key of leftKeys) {
        if (!compare(left[key], right[key])) return false;
      }
      return true;
    }

    return false;
  };
  return compare(a, b);
}

export function mergeWithArrayOverride<T extends object>(
  source: Partial<T>,
  target: T
): T {
  const seen = new WeakMap<object, WeakMap<object, object>>();
  const merge = (src: any, dst: any): any => {
    const output: Record<string, any> = { ...dst };
    for (const [key, sourceValue] of Object.entries(src ?? {})) {
      if (sourceValue === undefined) continue;
      const targetValue = dst?.[key];
      if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
        let inner = seen.get(sourceValue);
        if (!inner) {
          inner = new WeakMap<object, object>();
          seen.set(sourceValue, inner);
        }
        const cached = inner.get(targetValue);
        if (cached) {
          output[key] = cached;
          continue;
        }
        const mergedChild = merge(sourceValue, targetValue);
        inner.set(targetValue, mergedChild);
        output[key] = mergedChild;
        continue;
      }
      output[key] = sourceValue;
    }
    return output;
  };
  return merge(source, target) as T;
}

export function stableSortBy<T>(
  list: readonly T[],
  compare: (a: T, b: T) => number
): T[] {
  return list
    .map((item, index) => ({ index, item }))
    .sort((a, b) => {
      const result = compare(a.item, b.item);
      if (result !== 0) return result;
      return a.index - b.index;
    })
    .map((entry) => entry.item);
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}

export function isPlainObjectValue(value: unknown): value is Record<string, any> {
  return isPlainObject(value);
}
