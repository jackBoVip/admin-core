import type { AdminTableReactProps, ExtendedAdminTableApi } from '../types';

import {
  createTableApi,
  deepEqual,
  pickTableRuntimeStateOptions,
} from '@admin-core/table-core';
import { useEffect, useMemo, useRef } from 'react';

import { AdminTable } from '../components/AdminTable';
import { useTableSelector } from './use-table-selector';

export function useAdminTable<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
>(options: AdminTableReactProps<TData, TFormValues> = {}) {
  const initialRuntimeOptions = pickTableRuntimeStateOptions<TData, TFormValues>(
    options as Record<string, any>
  );
  const apiRef = useRef<ExtendedAdminTableApi<TData, TFormValues> | null>(null);
  if (!apiRef.current) {
    apiRef.current = createTableApi<TData, TFormValues>(
      initialRuntimeOptions
    ) as ExtendedAdminTableApi<TData, TFormValues>;
  }
  const api = apiRef.current;
  const optionsRef = useRef(initialRuntimeOptions);

  useEffect(() => {
    const nextRuntimeOptions = pickTableRuntimeStateOptions<TData, TFormValues>(
      options as Record<string, any>
    );
    if (deepEqual(optionsRef.current, nextRuntimeOptions)) {
      return;
    }
    optionsRef.current = nextRuntimeOptions;
    api.setState(nextRuntimeOptions);
  }, [api, options]);

  useEffect(() => {
    return () => {
      api.unmount();
    };
  }, [api]);

  function useStore<TSlice = AdminTableReactProps<TData, TFormValues>>(
    selector?: (state: AdminTableReactProps<TData, TFormValues>) => TSlice
  ) {
    const safeSelector =
      selector ??
      ((state: AdminTableReactProps<TData, TFormValues>) =>
        state as unknown as TSlice);
    return useTableSelector(api, safeSelector);
  }

  api.useStore = useStore;

  const Table = useMemo(
    () =>
      function UseAdminTable(props: AdminTableReactProps<TData, TFormValues>) {
        return <AdminTable {...(props as any)} api={api as any} />;
      },
    [api]
  );

  return [Table, api] as const;
}

export type UseAdminTable = typeof useAdminTable;
