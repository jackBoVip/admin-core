import type { AdminTableApi } from '@admin-core/table-core';

import { useEffect, useState } from 'react';

export function useTableSelector<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
  TSlice = any,
>(
  api: AdminTableApi<TData, TFormValues>,
  selector: (state: any) => TSlice
) {
  const [slice, setSlice] = useState(() => selector(api.getSnapshot().props));

  useEffect(() => {
    return api.store.subscribeSelector(
      (snapshot) => selector(snapshot.props as any),
      (next) => {
        setSlice((prev) => (Object.is(prev, next) ? prev : next));
      }
    );
  }, [api, selector]);

  return slice;
}
