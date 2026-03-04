/**
 * Vue 版 Query + Table 组合页 Hook。
 * @description 负责初始化组合 API 运行时资源，并返回绑定该 API 的组合组件。
 */

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

/**
 * 创建 Query + Table 组合页 Hook（Vue）。
 *
 * @param options 组合页初始化配置。
 * @returns `[PageQueryTableComponent, api]` 元组。
 */
export function useAdminPageQueryTable<
  TData extends Record<string, unknown> = Record<string, unknown>,
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>(
  options: AdminPageQueryTableVueProps<TData, TFormValues> = {}
): UseAdminPageQueryTableReturn<TData, TFormValues> {
  /** 表单配置对象类型别名。 */
  type FormOptionsRecord = Record<string, unknown>;
  /** 表格 API 创建参数类型别名。 */
  type CreateTableApiOptions = Parameters<
    typeof createTableApi<TData, TFormValues>
  >[0];
  /** 表格配置对象类型别名。 */
  type TableOptionsRecord = Record<string, unknown>;
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
  /**
   * 初始化并解析 query-table 运行时资源。
   * @description 统一返回 `api/formApi/tableApi` 及所有权信息。
   */
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

  /**
   * 当前 Hook 作用域内的资源清理。
   * @description 仅释放内部创建的 form/table 实例，不影响外部传入实例。
   */
  onBeforeUnmount(() => {
    cleanupPageQueryTableApis({
      formApi,
      ownsFormApi: !providedFormApi,
      ownsTableApi: !providedTableApi,
      tableApi,
    });
  });

  /**
   * 绑定当前 API 的 Query + Table 组合页组件构造器。
   * @description 返回稳定组件工厂，确保调用方在同一 Hook 生命周期内复用同一 API。
   */
  const PageQueryTable = defineComponent(
    (props: Partial<AdminPageQueryTableVueProps<TData, TFormValues>>, { attrs, slots }) => {
      /**
       * 渲染 Query + Table 组合页组件。
       * @description 合并初始化参数、运行时覆盖参数与外部 attrs，并注入统一 API。
       * @returns 组合页组件渲染函数。
       */
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

/**
 * `useAdminPageQueryTable` 函数类型别名。
 */
export type UseAdminPageQueryTable = typeof useAdminPageQueryTable;
