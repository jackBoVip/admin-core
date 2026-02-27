import type {
  AdminPageApi,
  AdminPageOptions,
} from '@admin-core/page-core';

import { useSyncExternalStore } from 'react';

export function usePageSelector<TComponent = unknown, TSlice = unknown>(
  api: AdminPageApi<TComponent>,
  selector: (state: AdminPageOptions<TComponent>) => TSlice
): TSlice {
  return useSyncExternalStore(
    (onStoreChange) => api.store.subscribe(onStoreChange),
    () => selector(api.getSnapshot().props),
    () => selector(api.getSnapshot().props)
  );
}
