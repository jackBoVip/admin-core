import type { StoreApi } from '@admin-core/table-core';
import type { Ref } from 'vue';

import { onScopeDispose, ref } from 'vue';

export function useTableStore<TState, TSlice>(
  store: StoreApi<TState>,
  selector: (state: TState) => TSlice
) {
  const stateRef = ref(selector(store.getState())) as Ref<TSlice>;

  const unsubscribe = store.subscribeSelector(selector, (next) => {
    stateRef.value = next;
  });

  onScopeDispose(() => {
    unsubscribe();
  });

  return stateRef as Readonly<Ref<TSlice>>;
}
