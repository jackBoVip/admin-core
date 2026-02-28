import { resolveSearchFormDefaults } from '@admin-core/form-react';
import { resolvePageQuerySearchFormOptions } from '@admin-core/page-core';

type QueryFormOptionsRecord = Record<string, unknown>;

export function normalizePageQueryFormOptions<T extends QueryFormOptionsRecord>(
  options: T | undefined
) {
  return resolvePageQuerySearchFormOptions(
    (options ?? {}) as T & QueryFormOptionsRecord,
    (resolved) =>
      resolveSearchFormDefaults(
        resolved as QueryFormOptionsRecord
      ) as T & QueryFormOptionsRecord
  ) as T;
}
