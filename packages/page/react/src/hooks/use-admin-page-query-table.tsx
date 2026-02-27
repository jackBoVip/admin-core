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
  resolvePageQueryTableApiBundle,
  resolvePageQueryTableOptionsWithStripeDefaults,
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
import { normalizePageQueryFormOptions } from '../utils/query-form-options';

export function useAdminPageQueryTable<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
>(
  options: AdminPageQueryTableReactProps<TData, TFormValues> = {}
): UseAdminPageQueryTableReturn<TData, TFormValues> {
  const initialRuntimeRef = useRef<ReturnType<
    typeof resolvePageQueryTableApiBundle<AdminFormApi, AdminTableApi<TData, TFormValues>, AdminPageQueryTableApi<TData, TFormValues>>
  > | null>(null);
  if (!initialRuntimeRef.current) {
    initialRuntimeRef.current = resolvePageQueryTableApiBundle({
      api: options.api as AdminPageQueryTableApi<TData, TFormValues> | undefined,
      createFormApi: () =>
        createFormApi(
          normalizePageQueryFormOptions(
            (options.formOptions ?? {}) as Record<string, any>
          )
        ),
      createTableApi: () =>
        createTableApi<TData, TFormValues>({
          ...(resolvePageQueryTableOptionsWithStripeDefaults(
            (options.tableOptions ?? {}) as Record<string, any>,
            (stripe: unknown, stripeDefaults: Record<string, any>) =>
              resolveTableStripeConfig(stripe as any, stripeDefaults as any),
            DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS
          ) as any),
        } as any),
      formApi: options.formApi,
      tableApi: options.tableApi,
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
        return (
          <AdminPageQueryTable
            {...(runtimeOptions as any)}
            {...(props as any)}
            api={api}
          />
        );
      },
    [api]
  );

  return [PageQueryTable, api];
}

export type UseAdminPageQueryTable = typeof useAdminPageQueryTable;
