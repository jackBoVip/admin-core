/**
 * Table React 切片订阅 Hook。
 * @description 基于 `useSyncExternalStore` 订阅 tableApi 快照切片变化。
 */
import type { AdminTableApi } from '@admin-core/table-core';

import { useRef, useSyncExternalStore } from 'react';

/**
 * 切片未初始化哨兵值。
 */
const UNSET = Symbol('unset');

/**
 * `useTableSelector` 返回值类型。
 * @template TSlice 切片类型。
 */
export type UseTableSelectorReturn<TSlice> = TSlice;

/**
 * 从表格 API 快照中选择状态切片。
 * @template TData 行数据类型。
 * @template TFormValues 表单值类型。
 * @template TSlice 切片类型。
 * @param api 表格 API。
 * @param selector 切片选择器。
 * @returns 订阅后的状态切片。
 */
export function useTableSelector<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
  TSlice = any,
>(
  api: AdminTableApi<TData, TFormValues>,
  selector: (state: any) => TSlice
): UseTableSelectorReturn<TSlice> {
  /**
   * 选择器引用
   * @description 始终指向最新选择器，避免订阅回调闭包陈旧。
   */
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  /**
   * 切片缓存引用
   * @description 配合 `Object.is` 实现稳定引用复用。
   */
  const sliceRef = useRef<TSlice | typeof UNSET>(UNSET);

  /**
   * 获取当前状态切片快照
   * @description 基于选择器计算切片并通过 `Object.is` 复用稳定引用。
   * @returns 当前状态切片。
   */
  const getSnapshot = () => {
    const next = selectorRef.current(api.getSnapshot().props);
    if (sliceRef.current !== UNSET && Object.is(sliceRef.current, next)) {
      return sliceRef.current as TSlice;
    }
    sliceRef.current = next;
    return next;
  };

  return useSyncExternalStore(
    /**
     * 订阅表格状态变化并按需触发重渲染。
     * @description 仅当选择器输出实际变化时触发 `onStoreChange`，减少无效更新。
     */
    (onStoreChange) =>
      api.store.subscribe(() => {
        const next = selectorRef.current(api.getSnapshot().props);
        if (sliceRef.current !== UNSET && Object.is(sliceRef.current, next)) {
          return;
        }
        sliceRef.current = next;
        onStoreChange();
      }),
    getSnapshot,
    getSnapshot
  );
}
