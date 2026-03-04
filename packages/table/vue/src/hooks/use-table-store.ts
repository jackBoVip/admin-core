/**
 * 表格 Store 选择器 Hook（Vue）。
 * @description 基于共享层 `useStoreSelector` 对表格状态订阅进行轻量封装。
 */
import type { StoreApi } from '@admin-core/table-core';
import type { Ref } from 'vue';

import { useStoreSelector } from '@admin-core/shared-vue';

/**
 * `useTableStore` 返回值类型。
 * @description 对切片 `Ref` 添加只读约束，避免在调用方直接写入派生值。
 * @template TSlice 切片类型。
 */
export type UseTableStoreReturn<TSlice> = Readonly<Ref<TSlice>>;

/**
 * 从表格 Store 中选择状态切片。
 * @description 对共享层 `useStoreSelector` 做 table 语义封装，统一调用入口。
 * @template TState 状态类型。
 * @template TSlice 切片类型。
 * @param store Store 实例。
 * @param selector 切片选择器。
 * @returns 选中的状态切片。
 */
export function useTableStore<TState, TSlice>(
  store: StoreApi<TState>,
  selector: (state: TState) => TSlice
): UseTableStoreReturn<TSlice> {
  /**
   * 返回响应式状态切片。
   * @description 当 `selector` 输出变化时，依赖组件会自动触发更新。
   */
  return useStoreSelector(store, selector);
}
