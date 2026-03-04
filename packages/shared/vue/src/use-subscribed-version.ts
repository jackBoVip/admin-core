/**
 * Shared Vue 通用版本订阅 Composable。
 * @description 在组件生命周期内建立外部版本订阅，并同步到只读 `Ref`。
 */
import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';

/**
 * 订阅版本号并在变更时更新 Vue `Ref`。
 * @description 在组件挂载期建立订阅并在卸载期自动清理。
 *
 * @template TVersion 版本值类型。
 * @param getVersion 当前版本读取函数。
 * @param subscribeVersionChange 版本变更订阅函数。
 * @returns 只读版本 `Ref`。
 */
export function useSubscribedVersion<TVersion>(
  getVersion: () => TVersion,
  subscribeVersionChange: (listener: () => void) => () => void
): Readonly<Ref<TVersion>> {
  /**
   * 当前版本值响应式引用。
   * @description 作为订阅结果的单一来源，供调用方直接读取并追踪变化。
   */
  const version = ref(getVersion()) as Ref<TVersion>;
  /**
   * 版本订阅解绑函数。
   * @description 在组件卸载时调用，避免监听泄漏。
   */
  let unsubscribe: null | (() => void) = null;

  /**
   * 组件挂载后建立版本订阅。
   * @returns 无返回值。
   */
  onMounted(() => {
    unsubscribe = subscribeVersionChange(() => {
      version.value = getVersion();
    });
  });

  /**
   * 组件卸载前释放版本订阅。
   * @returns 无返回值。
   */
  onBeforeUnmount(() => {
    unsubscribe?.();
    unsubscribe = null;
  });

  return version;
}
