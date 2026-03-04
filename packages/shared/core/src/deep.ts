/**
 * Shared Core 深比较与深合并工具。
 * @description 提供深拷贝、深比较与数组覆盖式对象合并能力。
 */
import { deepClonePlain } from './clone';

/**
 * 判断值是否为普通对象。
 * @param value 待判断值。
 * @returns 是否普通对象。
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * 深拷贝值。
 * @template T 值类型。
 * @param value 待拷贝值。
 * @returns 深拷贝结果。
 */
export function deepClone<T>(value: T): T {
  return deepClonePlain(value);
}

/**
 * 深比较两个值是否相等（不处理循环引用）。
 * @param a 左值。
 * @param b 右值。
 * @returns 是否相等。
 */
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

/**
 * 记录已比较对象对，避免循环比较死循环。
 * @param a 左对象。
 * @param b 右对象。
 * @param seen 已比较映射。
 * @returns 是否已存在该对象对的比较记录。
 */
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

/**
 * 深比较两个值是否相等（支持循环引用）。
 * @param a 左值。
 * @param b 右值。
 * @returns 是否相等。
 */
export function deepEqualWithCycles(a: unknown, b: unknown): boolean {
  const seen = new WeakMap<object, WeakSet<object>>();

  /**
   * 递归比较两个值是否深度相等。
   * @param left 左值。
   * @param right 右值。
   * @returns 是否相等。
   */
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

/**
 * 数组合并覆盖策略配置。
 */
export interface MergeWithArrayOverrideOptions {
  /** 合并时数组是否复制（默认 `true`）。 */
  cloneArrays?: boolean;
  /** 是否启用循环引用跟踪（默认 `false`）。 */
  trackCircularRefs?: boolean;
}

/**
 * 数组合并覆盖内部上下文。
 * @internal
 */
interface MergeWithArrayOverrideContext {
  /** 合并时数组是否复制。 */
  cloneArrays: boolean;
  /** 循环引用跟踪映射。 */
  seen?: WeakMap<object, WeakMap<object, object>>;
}

/**
 * 递归合并对象，数组字段采用覆盖策略。
 * @param source 源对象。
 * @param target 目标对象。
 * @param context 合并上下文。
 * @param output 输出对象。
 * @returns 合并结果。
 */
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

/**
 * 合并对象，数组字段直接覆盖（而非按索引深合并）。
 * @template T 对象类型。
 * @param source 源对象。
 * @param target 目标对象。
 * @param options 合并配置。
 * @returns 合并后的对象。
 */
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
