/**
 * React 版 Query + Table 组合页 Hook。
 * @description 负责初始化组合 API 运行时资源，并返回绑定该 API 的组合组件。
 */

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

/**
 * 创建 Query + Table 组合页 Hook（React）。
 *
 * @param options 组合页初始化配置。
 * @returns `[PageQueryTableComponent, api]` 元组。
 */
export function useAdminPageQueryTable<
  TData extends Record<string, unknown> = Record<string, unknown>,
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>(
  options: AdminPageQueryTableReactProps<TData, TFormValues> = {}
): UseAdminPageQueryTableReturn<TData, TFormValues> {
  /**
   * 首次初始化后的运行时资源缓存。
   * @description 避免在组件重复渲染时重复创建 form/table/api 实例。
   */
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
    /**
     * Query 表单配置的标准化记录类型。
     */
    type FormOptionsRecord = Record<string, unknown>;
    /**
     * Table 配置的标准化记录类型。
     */
    type TableOptionsRecord = Record<string, unknown>;
    /**
     * `createTableApi` 的首参类型别名。
     */
    type CreateTableApiOptions = Parameters<
      typeof createTableApi<TData, TFormValues>
    >[0];
    /**
     * Query-Table 选项解析器。
     * @description 提供表单标准化与斑马纹配置解析能力。
     */
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
  /**
   * 当前 query-table 运行时资源包。
   */
  const runtime = initialRuntimeRef.current;
  if (!runtime) {
    throw new Error('Page query-table runtime initialization failed');
  }
  /**
   * query-table 运行时核心资源。
   * @description 包含组合 API、form/table API 及其外部所有权标记。
   */
  const { api, formApi, providedFormApi, providedTableApi, tableApi } = runtime;

  /**
   * 持有最新外部配置引用，供 `PageQueryTable` 渲染阶段读取。
   */
  const optionsRef = useRef(options);
  optionsRef.current = options;
  /**
   * 清理内部持有的 form/table API。
   */
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

  /**
   * 绑定当前 API 的 Query + Table 组合组件构造器。
   * @description 返回稳定组件工厂，保证调用方在同一 Hook 生命周期内复用同一 API。
   */
  const PageQueryTable = useMemo(
    () =>
      /**
       * Query + Table 组合页渲染组件
       * @description 融合初始化配置与运行时传入属性，并注入统一 API。
       * @param props 运行时覆盖属性。
       * @returns 组合页组件节点。
       */
      function UseAdminPageQueryTable(
        props: Partial<AdminPageQueryTableReactProps<TData, TFormValues>>
      ) {
        /**
         * 最新初始化配置快照。
         * @description 作为运行时覆盖前的基准配置。
         */
        const runtimeOptions = optionsRef.current;
        /**
         * 合并后的组合页属性。
         * @description 优先使用运行时传入值，并强制注入当前 `api`。
         */
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

/**
 * `useAdminPageQueryTable` 函数类型别名。
 */
export type UseAdminPageQueryTable = typeof useAdminPageQueryTable;
