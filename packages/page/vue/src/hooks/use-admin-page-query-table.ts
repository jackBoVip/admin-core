import type {
  AdminPageQueryTableApi,
  AdminPageQueryTableVueProps,
  UseAdminPageQueryTableReturn,
} from '../types';

import { createFormApi } from '@admin-core/form-vue';
import {
  DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS,
  cleanupPageQueryTableApis,
  createPageQueryTableOptionResolvers,
  normalizePageQueryFormOptions,
  resolvePageQueryTableApiBundleWithStripeDefaults,
} from '@admin-core/page-core';
import {
  createTableApi,
  type AdminTableApi,
  resolveTableStripeConfig,
} from '@admin-core/table-vue';
import {
  type Component,
  defineComponent,
  h,
  onBeforeUnmount,
} from 'vue';

import { AdminPageQueryTable } from '../components/AdminPageQueryTable';

export function useAdminPageQueryTable<
  TData extends Record<string, unknown> = Record<string, unknown>,
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>(
  options: AdminPageQueryTableVueProps<TData, TFormValues> = {}
): UseAdminPageQueryTableReturn<TData, TFormValues> {
  type FormOptionsRecord = Record<string, unknown>;
  type CreateTableApiOptions = Parameters<
    typeof createTableApi<TData, TFormValues>
  >[0];
  type TableOptionsRecord = Record<string, unknown>;
  const pageQueryOptionResolvers = createPageQueryTableOptionResolvers<
    FormOptionsRecord,
    Parameters<typeof resolveTableStripeConfig>[0],
    NonNullable<Parameters<typeof resolveTableStripeConfig>[1]>
  >({
    normalizeFormOptions: normalizePageQueryFormOptions,
    resolveStripeConfig: resolveTableStripeConfig,
  });
  const {
    api,
    formApi,
    providedFormApi,
    providedTableApi,
    tableApi,
  } = resolvePageQueryTableApiBundleWithStripeDefaults({
    api: options.api as AdminPageQueryTableApi<TData, TFormValues> | undefined,
    createFormApi: (formOptions: FormOptionsRecord) => createFormApi(formOptions),
    createTableApi: (tableOptions: TableOptionsRecord) =>
      createTableApi<TData, TFormValues>(
        tableOptions as CreateTableApiOptions
      ) as AdminTableApi<TData, TFormValues>,
    formApi: options.formApi,
    formOptions: (options.formOptions ?? {}) as FormOptionsRecord,
    normalizeFormOptions: pageQueryOptionResolvers.normalizeFormOptions,
    resolveStripeConfig: pageQueryOptionResolvers.resolveStripeConfig,
    stripeDefaults: DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS,
    tableApi: options.tableApi,
    tableOptions: (options.tableOptions ?? {}) as TableOptionsRecord,
  });

  onBeforeUnmount(() => {
    cleanupPageQueryTableApis({
      formApi,
      ownsFormApi: !providedFormApi,
      ownsTableApi: !providedTableApi,
      tableApi,
    });
  });

  const PageQueryTable = defineComponent(
    (props: Partial<AdminPageQueryTableVueProps<TData, TFormValues>>, { attrs, slots }) => {
      return () =>
        h(AdminPageQueryTable as unknown as Component, {
          ...(options as Record<string, unknown>),
          ...(props as Record<string, unknown>),
          ...(attrs as Record<string, unknown>),
          api,
        }, slots);
    },
    {
      name: 'AdminPageQueryTableUse',
      inheritAttrs: false,
    }
  );

  return [PageQueryTable, api];
}

export type UseAdminPageQueryTable = typeof useAdminPageQueryTable;
