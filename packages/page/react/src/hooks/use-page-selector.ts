/**
 * React 版 Page 状态选择器 Hook。
 * @description 基于 `useSyncExternalStore` 订阅页面 store，并按 selector 输出状态切片。
 */

import type {
  AdminPageApi,
  AdminPageOptions,
} from '@admin-core/page-core';

import { useRef, useSyncExternalStore } from 'react';

/**
 * 订阅页面状态并按 selector 返回切片值（React）。
 *
 * @template TComponent 页面组件类型。
 * @template TSlice 订阅切片类型。
 * @param api 页面 API 实例。
 * @param selector 状态切片选择器。
 * @returns 订阅后的切片值。
 */
export function usePageSelector<TComponent = unknown, TSlice = unknown>(
  api: AdminPageApi<TComponent>,
  selector: (state: AdminPageOptions<TComponent>) => TSlice
): TSlice {
  /**
   * 保存最新 selector 引用，避免外部闭包变化导致重复订阅。
   */
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  /**
   * 订阅 store 切片变化。
   * @description 订阅 `props` 变化并透传给 React 外部状态更新回调。
   * @param onStoreChange React 外部状态更新回调。
   * @returns 取消订阅函数。
   */
  const subscribe = (onStoreChange: () => void) =>
    api.store.subscribeSelector(
      (snapshot) => selectorRef.current(snapshot.props),
      () => onStoreChange()
    );

  /**
   * 获取当前切片快照。
   * @description 作为 `useSyncExternalStore` 的客户端与服务端快照读取函数。
   * @returns 当前 selector 选中的切片值。
   */
  const getSnapshot = () => selectorRef.current(api.getSnapshot().props);

  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot
  );
}
