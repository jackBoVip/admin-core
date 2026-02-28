import type {
  AdminPageQueryTableApi,
  AdminPageQueryTableReactProps,
  UseAdminPageQueryTableReturn,
} from '../types';
import type { AdminFormApi } from '@admin-core/form-react';
import type { AdminTableApi } from '@admin-core/table-react';

import { createFormApi } from '@admin-core/form-react';
import {
  DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS,
  cleanupPageQueryTableApis,
  createPageQueryTableOptionResolvers,
  normalizePageQueryFormOptions,
  resolvePageQueryTableApiBundleWithStripeDefaults,
} from '@admin-core/page-core';
import {
  createTableApi,
  resolveTableStripeConfig,
} from '@admin-core/table-react';
import {
  useEffect,
  useMemo,
  useRef,
} from 'react';

import {
  AdminPageQueryTable,
} from '../components/AdminPageQueryTable';

export function useAdminPageQueryTable<
  TData extends Record<string, unknown> = Record<string, unknown>,
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>(
  options: AdminPageQueryTableReactProps<TData, TFormValues> = {}
): UseAdminPageQueryTableReturn<TData, TFormValues> {
  const initialRuntimeRef = useRef<ReturnType<
    typeof resolvePageQueryTableApiBundleWithStripeDefaults<
      AdminFormApi,
      AdminTableApi<TData, TFormValues>,
      AdminPageQueryTableApi<TData, TFormValues>,
      Record<string, unknown>,
      Record<string, unknown>,
      Record<string, unknown>
    >
  > | null>(null);
  if (!initialRuntimeRef.current) {
    type FormOptionsRecord = Record<string, unknown>;
    type TableOptionsRecord = Record<string, unknown>;
    type CreateTableApiOptions = Parameters<
      typeof createTableApi<TData, TFormValues>
    >[0];
    const pageQueryOptionResolvers = createPageQueryTableOptionResolvers<
      FormOptionsRecord,
      Parameters<typeof resolveTableStripeConfig>[0],
      NonNullable<Parameters<typeof resolveTableStripeConfig>[1]>
    >({
      normalizeFormOptions: normalizePageQueryFormOptions,
      resolveStripeConfig: resolveTableStripeConfig,
    });
    initialRuntimeRef.current = resolvePageQueryTableApiBundleWithStripeDefaults({
      api: options.api as AdminPageQueryTableApi<TData, TFormValues> | undefined,
      createFormApi: (formOptions: FormOptionsRecord) => createFormApi(formOptions),
      createTableApi: (tableOptions: TableOptionsRecord) =>
        createTableApi<TData, TFormValues>(
          tableOptions as CreateTableApiOptions
        ),
      formApi: options.formApi,
      formOptions: (options.formOptions ?? {}) as FormOptionsRecord,
      normalizeFormOptions: pageQueryOptionResolvers.normalizeFormOptions,
      resolveStripeConfig: pageQueryOptionResolvers.resolveStripeConfig,
      stripeDefaults: DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS,
      tableApi: options.tableApi,
      tableOptions: (options.tableOptions ?? {}) as TableOptionsRecord,
    });
  }
  const runtime = initialRuntimeRef.current;
  if (!runtime) {
    throw new Error('Page query-table runtime initialization failed');
  }
  const { api, formApi, providedFormApi, providedTableApi, tableApi } = runtime;

  const optionsRef = useRef(options);
  optionsRef.current = options;
  useEffect(() => {
    return () => {
      cleanupPageQueryTableApis({
        formApi,
        ownsFormApi: !providedFormApi,
        ownsTableApi: !providedTableApi,
        tableApi,
      });
    };
  }, [formApi, providedFormApi, providedTableApi, tableApi]);

  const PageQueryTable = useMemo(
    () =>
      function UseAdminPageQueryTable(
        props: Partial<AdminPageQueryTableReactProps<TData, TFormValues>>
      ) {
        const runtimeOptions = optionsRef.current;
        const mergedProps = {
          ...runtimeOptions,
          ...props,
          api,
        } as unknown as AdminPageQueryTableReactProps;
        return (
          <AdminPageQueryTable
            {...mergedProps}
          />
        );
      },
    [api]
  );

  return [PageQueryTable, api];
}

export type UseAdminPageQueryTable = typeof useAdminPageQueryTable;
