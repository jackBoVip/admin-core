import type { AdminTableApi } from '@admin-core/table-core';

import { useRef, useSyncExternalStore } from 'react';

const UNSET = Symbol('unset');

export function useTableSelector<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
  TSlice = any,
>(
  api: AdminTableApi<TData, TFormValues>,
  selector: (state: any) => TSlice
) {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  const sliceRef = useRef<TSlice | typeof UNSET>(UNSET);
  const getSnapshot = () => {
    const next = selectorRef.current(api.getSnapshot().props);
    if (sliceRef.current !== UNSET && Object.is(sliceRef.current, next)) {
      return sliceRef.current as TSlice;
    }
    sliceRef.current = next;
    return next;
  };

  return useSyncExternalStore(
    (onStoreChange) =>
      api.store.subscribe(() => {
        const next = selectorRef.current(api.getSnapshot().props);
        if (sliceRef.current !== UNSET && Object.is(sliceRef.current, next)) {
          return;
        }
        sliceRef.current = next;
        onStoreChange();
      }),
    getSnapshot,
    getSnapshot
  );
}
