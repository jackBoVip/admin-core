/**
 * Form Vue 语言版本 Composable。
 * @description 基于 shared-vue 版本订阅能力，监听 form-core 语言变更版本号。
 */
import {
  getLocaleVersion,
  subscribeLocaleChange,
} from '@admin-core/form-core';
import { createUseLocaleVersionHook } from '@admin-core/shared-vue';

/**
 * Form 语言版本订阅 Hook 工厂返回值。
 */
const useLocaleVersionHook = createUseLocaleVersionHook(
  getLocaleVersion,
  subscribeLocaleChange
);

/**
 * Form 语言版本订阅返回值类型。
 * @description 复用工厂 Hook 返回类型，保持与 `shared-vue` 的 `Readonly<Ref<...>>` 一致。
 */
type FormLocaleVersion = ReturnType<typeof useLocaleVersionHook>;

/**
 * 订阅并返回 form 语言版本号。
 * @description 语言资源更新后返回值会变化，可用于触发依赖语言的重渲染。
 * @returns 当前语言版本号。
 */
export function useLocaleVersion(): FormLocaleVersion {
  return useLocaleVersionHook();
}
