/**
 * Shared Core 路径读取工具。
 * @description 提供按点路径安全读取对象字段的通用函数。
 */
/**
 * `getByPath` 行为选项。
 * @description 控制空路径与空 key 的解析策略，适配不同数据读取约定。
 */
export interface GetByPathOptions {
  /** 空路径时返回原值（`value`）还是默认值（`default`）。 */
  emptyPath: 'value' | 'default';
  /** 遍历时是否忽略由连续 `.` 产生的空 key。 */
  skipEmptyKeys?: boolean;
}

/**
 * `getByPath` 默认行为配置。
 * @description 保持空路径返回默认值，并且不跳过空 key。
 */
const DEFAULT_GET_BY_PATH_OPTIONS: GetByPathOptions = {
  emptyPath: 'default',
  skipEmptyKeys: false,
};

/**
 * 按点路径读取对象属性。
 *
 * @template T 返回值类型。
 * @param obj 目标对象。
 * @param path 点路径，例如 `a.b.c`。
 * @param defaultValue 读取失败或值为 `undefined` 时的回退值。
 * @param options 路径读取行为配置。
 * @returns 路径命中的值或默认值。
 */
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
