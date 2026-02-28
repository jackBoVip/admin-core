import type {
  AdminPageApi,
  AdminPageOptions,
} from '@admin-core/page-core';

import { useRef, useSyncExternalStore } from 'react';

export function usePageSelector<TComponent = unknown, TSlice = unknown>(
  api: AdminPageApi<TComponent>,
  selector: (state: AdminPageOptions<TComponent>) => TSlice
): TSlice {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  return useSyncExternalStore(
    (onStoreChange) =>
      api.store.subscribeSelector(
        (snapshot) => selectorRef.current(snapshot.props),
        () => onStoreChange()
      ),
    () => selectorRef.current(api.getSnapshot().props),
    () => selectorRef.current(api.getSnapshot().props)
  );
}
