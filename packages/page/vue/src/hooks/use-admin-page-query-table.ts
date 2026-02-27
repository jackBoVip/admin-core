import type {
  AdminPageQueryTableApi,
  AdminPageQueryTableVueProps,
  UseAdminPageQueryTableReturn,
} from '../types';

import { createFormApi } from '@admin-core/form-vue';
import {
  DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS,
  cleanupPageQueryTableApis,
  resolvePageQueryTableApiBundle,
  resolvePageQueryTableOptionsWithStripeDefaults,
} from '@admin-core/page-core';
import {
  createTableApi,
  type AdminTableApi,
  resolveTableStripeConfig,
} from '@admin-core/table-vue';
import {
  defineComponent,
  h,
  onBeforeUnmount,
} from 'vue';

import { AdminPageQueryTable } from '../components/AdminPageQueryTable';
import { normalizePageQueryFormOptions } from '../utils/query-form-options';

export function useAdminPageQueryTable<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
>(
  options: AdminPageQueryTableVueProps<TData, TFormValues> = {}
): UseAdminPageQueryTableReturn<TData, TFormValues> {
  const {
    api,
    formApi,
    providedFormApi,
    providedTableApi,
    tableApi,
  } = resolvePageQueryTableApiBundle({
    api: options.api as AdminPageQueryTableApi<TData, TFormValues> | undefined,
    createFormApi: () =>
      createFormApi(
        normalizePageQueryFormOptions(
          (options.formOptions ?? {}) as Record<string, any>
        )
      ),
      createTableApi: () =>
        createTableApi<TData, TFormValues>(
        resolvePageQueryTableOptionsWithStripeDefaults(
          (options.tableOptions ?? {}) as Record<string, any>,
          (stripe: unknown, stripeDefaults: Record<string, any>) =>
            resolveTableStripeConfig(stripe as any, stripeDefaults as any),
          DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS
        ) as any
      ) as AdminTableApi<TData, TFormValues>,
    formApi: options.formApi,
    tableApi: options.tableApi,
  });

  const PageQueryTable = defineComponent(
    (props: Partial<AdminPageQueryTableVueProps<TData, TFormValues>>, { attrs, slots }) => {
      onBeforeUnmount(() => {
        cleanupPageQueryTableApis({
          formApi,
          ownsFormApi: !providedFormApi,
          ownsTableApi: !providedTableApi,
          tableApi,
        });
      });

      return () =>
        h(
          AdminPageQueryTable as any,
          {
            ...(options as any),
            ...props,
            ...(attrs as any),
            api,
          },
          slots
        );
    },
    {
      name: 'AdminPageQueryTableUse',
      inheritAttrs: false,
    }
  );

  return [PageQueryTable, api];
}

export type UseAdminPageQueryTable = typeof useAdminPageQueryTable;
