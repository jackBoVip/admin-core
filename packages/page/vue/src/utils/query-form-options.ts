import { resolveSearchFormDefaults } from '@admin-core/form-vue';
import { resolvePageQuerySearchFormOptions } from '@admin-core/page-core';

export function normalizePageQueryFormOptions<T extends Record<string, any>>(
  options: T | undefined
) {
  return resolvePageQuerySearchFormOptions(
    (options ?? {}) as T & Record<string, any>,
    (resolved) => resolveSearchFormDefaults(resolved as any) as T & Record<string, any>
  ) as T;
}
