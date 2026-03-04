/**
 * Shared React 语言版本订阅工厂。
 * @description 基于通用版本订阅 Hook 生成领域化的 locale 版本监听 Hook。
 */
import { useSubscribedVersion } from './use-subscribed-version';

/**
 * 创建用于订阅语言版本号的 React Hook 工厂。
 * @description 复用通用版本订阅逻辑，生成特定领域语言版本 Hook。
 *
 * @template TVersion 版本值类型。
 * @param getVersion 当前版本读取函数。
 * @param subscribeVersionChange 版本变更订阅函数。
 * @returns 可在组件中使用的语言版本订阅 Hook。
 */
export function createUseLocaleVersionHook<TVersion>(
  getVersion: () => TVersion,
  subscribeVersionChange: (listener: () => void) => () => void
) {
  /**
   * 读取并订阅语言版本号。
   *
   * @returns 当前语言版本值。
   */
  return function useLocaleVersion() {
    return useSubscribedVersion(subscribeVersionChange, getVersion);
  };
}
