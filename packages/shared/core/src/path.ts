export interface GetByPathOptions {
  emptyPath: 'value' | 'default';
  skipEmptyKeys?: boolean;
}

const DEFAULT_GET_BY_PATH_OPTIONS: GetByPathOptions = {
  emptyPath: 'default',
  skipEmptyKeys: false,
};

export function getByPath<T = unknown>(
  obj: unknown,
  path: string,
  defaultValue?: T,
  options: Partial<GetByPathOptions> = {}
): T {
  const resolvedOptions: GetByPathOptions = {
    ...DEFAULT_GET_BY_PATH_OPTIONS,
    ...options,
  };

  if (!path || path.trim() === '') {
    if (resolvedOptions.emptyPath === 'value') {
      return (obj === undefined ? defaultValue : obj) as T;
    }
    return defaultValue as T;
  }

  if (obj === null || obj === undefined) {
    return defaultValue as T;
  }

  const keys = path.split('.');
  let result: unknown = obj;

  for (const key of keys) {
    if (resolvedOptions.skipEmptyKeys && !key) {
      continue;
    }
    if (result === null || result === undefined) {
      return defaultValue as T;
    }
    result = (result as Record<string, unknown>)[key];
  }

  return (result === undefined ? defaultValue : result) as T;
}
