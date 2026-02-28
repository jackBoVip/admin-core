import type { StoreApi } from '@admin-core/table-core';

import { useStoreSelector } from '@admin-core/shared-vue';

export function useTableStore<TState, TSlice>(
  store: StoreApi<TState>,
  selector: (state: TState) => TSlice
) {
  return useStoreSelector(store, selector);
}
