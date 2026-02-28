import { deepClonePlain } from './clone';

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function deepClone<T>(value: T): T {
  return deepClonePlain(value);
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {
    return true;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i += 1) {
      if (!deepEqual(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) {
      return false;
    }
    for (const key of aKeys) {
      if (!deepEqual(a[key], b[key])) {
        return false;
      }
    }
    return true;
  }

  return false;
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

export function deepEqualWithCycles(a: unknown, b: unknown): boolean {
  const seen = new WeakMap<object, WeakSet<object>>();

  const compare = (left: unknown, right: unknown): boolean => {
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

export interface MergeWithArrayOverrideOptions {
  cloneArrays?: boolean;
  trackCircularRefs?: boolean;
}

interface MergeWithArrayOverrideContext {
  cloneArrays: boolean;
  seen?: WeakMap<object, WeakMap<object, object>>;
}

function mergeWithArrayOverrideInternal(
  source: Record<string, unknown>,
  target: Record<string, unknown>,
  context: MergeWithArrayOverrideContext,
  output: Record<string, unknown> = { ...target }
): Record<string, unknown> {
  for (const [key, sourceValue] of Object.entries(source)) {
    if (sourceValue === undefined) {
      continue;
    }

    const targetValue = target[key];

    if (Array.isArray(sourceValue)) {
      output[key] = context.cloneArrays ? [...sourceValue] : sourceValue;
      continue;
    }

    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      if (context.seen) {
        let inner = context.seen.get(sourceValue);
        if (!inner) {
          inner = new WeakMap<object, object>();
          context.seen.set(sourceValue, inner);
        }
        const cached = inner.get(targetValue);
        if (cached) {
          output[key] = cached;
          continue;
        }
        const mergedChildOutput: Record<string, unknown> = {
          ...(targetValue as Record<string, unknown>),
        };
        inner.set(targetValue, mergedChildOutput);
        const mergedChild = mergeWithArrayOverrideInternal(
          sourceValue,
          targetValue,
          context,
          mergedChildOutput
        );
        inner.set(targetValue, mergedChild);
        output[key] = mergedChild;
        continue;
      }

      output[key] = mergeWithArrayOverrideInternal(sourceValue, targetValue, context);
      continue;
    }

    output[key] = sourceValue;
  }

  return output;
}

export function mergeWithArrayOverride<T extends object>(
  source: Partial<T>,
  target: T,
  options?: MergeWithArrayOverrideOptions
): T {
  const context: MergeWithArrayOverrideContext = {
    cloneArrays: options?.cloneArrays ?? true,
    seen: options?.trackCircularRefs
      ? new WeakMap<object, WeakMap<object, object>>()
      : undefined,
  };

  return mergeWithArrayOverrideInternal(
    (source ?? {}) as Record<string, unknown>,
    target as Record<string, unknown>,
    context
  ) as T;
}
