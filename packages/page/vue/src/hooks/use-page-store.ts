/**
 * Vue 版 Page Store 选择器 Hook。
 * @description 基于 `@admin-core/shared-vue` 的选择器订阅能力输出页面状态切片。
 */

import type { StoreApi } from '@admin-core/page-core';
import type { Ref } from 'vue';

import { useStoreSelector } from '@admin-core/shared-vue';

/**
 * `usePageStore` 返回值类型。
 * @description 对 `Ref` 添加只读约束，避免在调用方误改 selector 切片。
 * @template TSlice 订阅切片类型。
 */
export type UsePageStoreReturn<TSlice> = Readonly<Ref<TSlice>>;

/**
 * 订阅页面 store 切片（Vue）。
 *
 * @template TState 页面 store 状态类型。
 * @template TSlice 订阅切片类型。
 * @param store 页面 store 实例。
 * @param selector 状态切片选择器。
 * @returns 当前切片对应的响应式只读值。
 */
export function usePageStore<TState, TSlice>(
  store: StoreApi<TState>,
  selector: (state: TState) => TSlice
) : UsePageStoreReturn<TSlice> {
  return useStoreSelector(store, selector);
}
