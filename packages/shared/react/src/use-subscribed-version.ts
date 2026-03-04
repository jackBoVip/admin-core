/**
 * Shared React 通用版本订阅 Hook。
 * @description 对 `useSyncExternalStore` 做轻量封装，统一外部状态版本订阅模式。
 */
import { useSyncExternalStore } from 'react';

/**
 * 订阅版本号并在变更时触发 React 组件更新。
 * @description 基于 `useSyncExternalStore` 保证并发模式下订阅一致性。
 *
 * @template TVersion 版本值类型。
 * @param subscribeVersionChange 版本变更订阅函数。
 * @param getVersion 当前版本读取函数。
 * @returns 最新版本值。
 */
export function useSubscribedVersion<TVersion>(
  subscribeVersionChange: (listener: () => void) => () => void,
  getVersion: () => TVersion
): TVersion {
  return useSyncExternalStore(
    subscribeVersionChange,
    getVersion,
    getVersion
  );
}
