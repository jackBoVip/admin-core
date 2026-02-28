import type { StoreApi } from '@admin-core/page-core';

import { useStoreSelector } from '@admin-core/shared-vue';

export function usePageStore<TState, TSlice>(
  store: StoreApi<TState>,
  selector: (state: TState) => TSlice
) {
  return useStoreSelector(store, selector);
}
