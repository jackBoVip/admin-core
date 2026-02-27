import type { ExtendedAdminTableApi, AdminTableVueProps } from '../types';

import {
  createTableApi,
  pickTableRuntimeStateOptions,
} from '@admin-core/table-core';
import { defineComponent, h, onBeforeUnmount } from 'vue';

import { useTableStore } from './use-table-store';
import AdminTable from '../components/AdminTable.vue';

export function useAdminTable<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
>(options: AdminTableVueProps<TData, TFormValues> = {}) {
  const api = createTableApi<TData, TFormValues>(
    pickTableRuntimeStateOptions<TData, TFormValues>(
      options as Record<string, any>
    ) as any
  );
  const extendedApi = api as ExtendedAdminTableApi<TData, TFormValues>;

  extendedApi.useStore = <TSlice = AdminTableVueProps<TData, TFormValues>>(
    selector?: (state: AdminTableVueProps<TData, TFormValues>) => TSlice
  ) =>
    useTableStore(api.store, (snapshot) => {
      const state = snapshot.props as AdminTableVueProps<TData, TFormValues>;
      return selector ? selector(state) : (state as unknown as TSlice);
    });

  const Table = defineComponent(
    (props: AdminTableVueProps<TData, TFormValues>, { attrs, slots }) => {
      onBeforeUnmount(() => {
        api.unmount();
      });

      return () =>
        h(
          AdminTable as any,
          {
            ...props,
            ...(attrs as any),
            api: extendedApi,
          },
          slots
        );
    },
    {
      name: 'AdminTableUse',
      inheritAttrs: false,
    }
  );

  return [Table, extendedApi] as const;
}

export type UseAdminTable = typeof useAdminTable;
