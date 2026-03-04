/** 路径分隔正则，支持点路径与数组索引路径。 */
const PATH_SPLIT_RE = /[.[\]]+/;

/**
 * 可变对象类型。
 */
type MutableObject = Record<string, any>;

/**
 * 将路径字符串拆分为路径段数组。
 * @param path 路径表达式（如 `a.b[0].c`）。
 * @returns 路径段数组。
 */
export function toPath(path: string): string[] {
  if (!path) return [];
  return path
    .split(PATH_SPLIT_RE)
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * 按路径读取对象值。
 * @param obj 目标对象。
 * @param path 路径表达式。
 * @returns 读取结果；路径不存在时返回 `undefined`。
 */
export function getByPath<T = any>(obj: Record<string, any>, path: string): T | undefined {
  const segments = toPath(path);
  if (segments.length === 0) return undefined;
  let current: any = obj;
  for (const key of segments) {
    if (current === null || current === undefined || !(key in current)) return undefined;
    current = current[key];
  }
  return current as T;
}

/**
 * 按路径写入对象值（可变更新）。
 * @param obj 目标对象。
 * @param path 路径表达式。
 * @param value 写入值。
 * @returns 无返回值。
 */
export function setByPath(obj: Record<string, any>, path: string, value: any) {
  const segments = toPath(path);
  if (segments.length === 0) return;
  let current: Record<string, any> = obj;
  for (let index = 0; index < segments.length - 1; index += 1) {
    const key = segments[index];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  current[segments[segments.length - 1]] = value;
}

/**
 * 按路径删除对象值（可变更新）。
 * @param obj 目标对象。
 * @param path 路径表达式。
 * @returns 无返回值。
 */
export function deleteByPath(obj: Record<string, any>, path: string) {
  const segments = toPath(path);
  if (segments.length === 0) return;
  let current: Record<string, any> = obj;
  for (let index = 0; index < segments.length - 1; index += 1) {
    const key = segments[index];
    if (!current[key] || typeof current[key] !== 'object') {
      return;
    }
    current = current[key];
  }
  delete current[segments[segments.length - 1]];
}

/**
 * 判断值是否为对象（排除 `null`）。
 * @param value 待判断值。
 * @returns 是否为对象。
 */
function isObjectLike(value: unknown): value is MutableObject {
  return typeof value === 'object' && value !== null;
}

/**
 * 克隆容器对象（数组或普通对象）。
 * @param value 原始容器。
 * @returns 克隆后的容器。
 */
function cloneContainer<T extends object>(value: T): T {
  if (Array.isArray(value)) {
    return [...value] as T;
  }
  return { ...value } as T;
}

/**
 * 将路径段转换为对象访问键。
 * @param container 当前容器。
 * @param segment 当前路径段。
 * @returns 对应键（数组场景返回数字索引）。
 */
function getSegmentKey(container: unknown, segment: string) {
  if (Array.isArray(container) && /^\d+$/.test(segment)) {
    return Number(segment);
  }
  return segment;
}

/**
 * 路径更新结果。
 */
type PathMutationResult<TValue> = {
  /** 是否发生变更。 */
  changed: boolean;
  /** 值。 */
  value: TValue;
};

/**
 * 按路径不可变写入对象值。
 * @param obj 原始对象。
 * @param path 路径表达式。
 * @param value 写入值。
 * @returns 变更状态与更新后对象。
 */
export function setByPathImmutable<T extends MutableObject>(
  obj: T,
  path: string,
  value: any
): PathMutationResult<T> {
  const segments = toPath(path);
  if (segments.length === 0) {
    return { changed: false, value: obj };
  }

  /**
   * 递归沿路径创建新容器并写入目标值。
   * @param current 当前节点值。
   * @param index 当前路径段索引。
   * @returns 变更状态与节点新值。
   */
  const mutate = (
    current: unknown,
    index: number
  ): PathMutationResult<unknown> => {
    if (index >= segments.length) {
      if (Object.is(current, value)) {
        return { changed: false, value: current };
      }
      return { changed: true, value };
    }

    const base: MutableObject = isObjectLike(current)
      ? (current as MutableObject)
      : {};
    const key = getSegmentKey(base, segments[index]);
    const childResult = mutate(base[key], index + 1);
    if (!childResult.changed) {
      return { changed: false, value: base };
    }

    const cloned = cloneContainer(base as object) as MutableObject;
    cloned[key] = childResult.value;
    return { changed: true, value: cloned };
  };

  const result = mutate(obj, 0);
  return {
    changed: result.changed,
    value: (result.value as T) ?? obj,
  };
}

/**
 * 按路径不可变删除对象值。
 * @param obj 原始对象。
 * @param path 路径表达式。
 * @returns 变更状态与更新后对象。
 */
export function deleteByPathImmutable<T extends MutableObject>(
  obj: T,
  path: string
): PathMutationResult<T> {
  const segments = toPath(path);
  if (segments.length === 0) {
    return { changed: false, value: obj };
  }

  /**
   * 递归沿路径删除目标字段，并在必要时复制容器。
   * @param current 当前节点值。
   * @param index 当前路径段索引。
   * @returns 变更状态与节点新值。
   */
  const mutate = (
    current: unknown,
    index: number
  ): PathMutationResult<unknown> => {
    if (!isObjectLike(current)) {
      return { changed: false, value: current };
    }

    const key = getSegmentKey(current, segments[index]);
    if (!(key in (current as MutableObject))) {
      return { changed: false, value: current };
    }

    if (index === segments.length - 1) {
      const cloned = cloneContainer(current as object) as MutableObject;
      if (Array.isArray(cloned)) {
        cloned.splice(Number(key), 1);
      } else {
        delete cloned[key];
      }
      return { changed: true, value: cloned };
    }

    const childResult = mutate((current as MutableObject)[key], index + 1);
    if (!childResult.changed) {
      return { changed: false, value: current };
    }

    const cloned = cloneContainer(current as object) as MutableObject;
    cloned[key] = childResult.value;
    return { changed: true, value: cloned };
  };

  const result = mutate(obj, 0);
  return {
    changed: result.changed,
    value: (result.value as T) ?? obj,
  };
}
