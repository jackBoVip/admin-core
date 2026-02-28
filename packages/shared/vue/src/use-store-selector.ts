import { onScopeDispose, ref, type Ref } from 'vue';

export interface SelectorStoreApi<TState> {
  getState: () => TState;
  subscribeSelector: <TSlice>(
    selector: (state: TState) => TSlice,
    listener: (next: TSlice) => void
  ) => () => void;
}

export function useStoreSelector<TState, TSlice>(
  store: SelectorStoreApi<TState>,
  selector: (state: TState) => TSlice
): Readonly<Ref<TSlice>> {
  const stateRef = ref(selector(store.getState())) as Ref<TSlice>;

  const unsubscribe = store.subscribeSelector(selector, (next) => {
    stateRef.value = next;
  });

  onScopeDispose(() => {
    unsubscribe();
  });

  return stateRef;
}
