const PATH_SPLIT_RE = /[.[\]]+/;

type MutableObject = Record<string, any>;

export function toPath(path: string): string[] {
  if (!path) return [];
  return path
    .split(PATH_SPLIT_RE)
    .map((item) => item.trim())
    .filter(Boolean);
}

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

function isObjectLike(value: unknown): value is MutableObject {
  return typeof value === 'object' && value !== null;
}

function cloneContainer<T extends object>(value: T): T {
  if (Array.isArray(value)) {
    return [...value] as T;
  }
  return { ...value } as T;
}

function getSegmentKey(container: unknown, segment: string) {
  if (Array.isArray(container) && /^\d+$/.test(segment)) {
    return Number(segment);
  }
  return segment;
}

type PathMutationResult<TValue> = {
  changed: boolean;
  value: TValue;
};

export function setByPathImmutable<T extends MutableObject>(
  obj: T,
  path: string,
  value: any
): PathMutationResult<T> {
  const segments = toPath(path);
  if (segments.length === 0) {
    return { changed: false, value: obj };
  }

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

export function deleteByPathImmutable<T extends MutableObject>(
  obj: T,
  path: string
): PathMutationResult<T> {
  const segments = toPath(path);
  if (segments.length === 0) {
    return { changed: false, value: obj };
  }

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
