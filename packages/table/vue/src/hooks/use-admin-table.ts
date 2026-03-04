/**
 * Table Vue 主 Hook。
 * @description 负责创建稳定的 tableApi，并返回绑定该 API 的表格组件。
 */
import type { ExtendedAdminTableApi, AdminTableVueProps } from '../types';

import {
  createTableApi,
  pickTableRuntimeStateOptions,
} from '@admin-core/table-core';
import { defineComponent, h, onBeforeUnmount } from 'vue';

import { useTableStore } from './use-table-store';
import AdminTable from '../components/AdminTable.vue';

/**
 * 创建 Vue 表格组件与 API。
 * @template TData 行数据类型。
 * @template TFormValues 表单值类型。
 * @param options 初始表格配置。
 * @returns `[TableComponent, api]` 元组。
 */
export function useAdminTable<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
>(options: AdminTableVueProps<TData, TFormValues> = {}) {
  /**
   * 表格 API 实例。
   * @description 由核心层创建，承载状态仓库与表格行为方法。
   */
  const api = createTableApi<TData, TFormValues>(
    pickTableRuntimeStateOptions<TData, TFormValues>(
      options as Record<string, any>
    ) as any
  );
  /**
   * 扩展后的表格 API。
   * @description 在原始 API 基础上补充 `useStore` 订阅能力。
   */
  const extendedApi = api as ExtendedAdminTableApi<TData, TFormValues>;

  /**
   * 订阅表格状态切片。
   * @description 未提供选择器时返回完整表格 props 状态。
   *
   * @template TSlice 状态切片类型。
   * @param selector 可选状态选择器。
   * @returns 选中状态切片的只读引用。
   */
  extendedApi.useStore = <TSlice = AdminTableVueProps<TData, TFormValues>>(
    selector?: (state: AdminTableVueProps<TData, TFormValues>) => TSlice
  ) =>
    useTableStore(api.store, (snapshot) => {
      const state = snapshot.props as AdminTableVueProps<TData, TFormValues>;
      return selector ? selector(state) : (state as unknown as TSlice);
    });

  /**
   * 绑定当前 API 的表格组件构造器。
   */
  const Table = defineComponent(
    (props: AdminTableVueProps<TData, TFormValues>, { attrs, slots }) => {
      /**
       * 渲染统一封装后的表格组件。
       * @description 合并运行时 props 与 attrs，并注入扩展 API。
       *
       * @returns 表格组件渲染函数。
       */
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

/**
 * `useAdminTable` Hook 类型。
 */
export type UseAdminTable = typeof useAdminTable;
