/**
 * Table React 主 Hook。
 * @description 负责创建稳定的 tableApi，并返回绑定该 API 的表格组件。
 */
import type { AdminTableReactProps, ExtendedAdminTableApi } from '../types';

import {
  createTableApi,
  deepEqual,
  pickTableRuntimeStateOptions,
} from '@admin-core/table-core';
import { useEffect, useMemo, useRef } from 'react';

import { AdminTable } from '../components/AdminTable';
import { useTableSelector } from './use-table-selector';

/**
 * 创建 React 表格组件与 API。
 * @template TData 行数据类型。
 * @template TFormValues 表单值类型。
 * @param options 初始表格配置。
 * @returns `[TableComponent, api]` 元组。
 */
export function useAdminTable<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
>(options: AdminTableReactProps<TData, TFormValues> = {}) {
  /**
   * 初始运行时配置。
   * @description 从入参中提取可写入表格状态仓库的字段。
   */
  const initialRuntimeOptions = pickTableRuntimeStateOptions<TData, TFormValues>(
    options as Record<string, any>
  );
  /**
   * 表格 API 引用。
   * @description 保证整个 Hook 生命周期内 API 实例稳定。
   */
  const apiRef = useRef<ExtendedAdminTableApi<TData, TFormValues> | null>(null);
  if (!apiRef.current) {
    apiRef.current = createTableApi<TData, TFormValues>(
      initialRuntimeOptions
    ) as ExtendedAdminTableApi<TData, TFormValues>;
  }
  /**
   * 当前生效的表格 API。
   */
  const api = apiRef.current;
  /**
   * 上一次应用到 API 的运行时配置缓存。
   */
  const optionsRef = useRef(initialRuntimeOptions);

  /**
   * 监听外部配置变化并按需同步到表格状态。
   */
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

  /**
   * 组件卸载时释放表格 API 挂载状态。
   */
  useEffect(() => {
    return () => {
      api.unmount();
    };
  }, [api]);

  /**
   * 订阅表格运行时状态
   * @description 支持传入选择器仅订阅目标切片，未传入时返回完整状态。
   * @template TSlice 切片类型。
   * @param selector 状态切片选择器。
   * @returns 订阅后的状态切片。
   */
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
      /**
       * 表格渲染组件
       * @description 将外部传入配置与当前 API 组装后渲染 `AdminTable`。
       * @param props 运行时表格配置。
       * @returns 表格组件节点。
       */
      function UseAdminTable(props: AdminTableReactProps<TData, TFormValues>) {
        return <AdminTable {...(props as any)} api={api as any} />;
      },
    [api]
  );

  return [Table, api] as const;
}

/**
 * `useAdminTable` Hook 类型。
 */
export type UseAdminTable = typeof useAdminTable;
