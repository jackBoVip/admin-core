/**
 * Vue 版 Page 语言版本组合式函数。
 * @description 封装 page-core 语言版本订阅能力，为组件提供轻量重渲染触发信号。
 */

import {
  getLocaleVersion,
  subscribeLocaleChange,
} from '@admin-core/page-core';
import { createUseLocaleVersionHook } from '@admin-core/shared-vue';

/**
 * Page 语言版本订阅 Hook 工厂返回值。
 */
const useLocaleVersionHook = createUseLocaleVersionHook(
  getLocaleVersion,
  subscribeLocaleChange
);

/**
 * Page 语言版本订阅返回值类型。
 * @description 复用工厂 Hook 返回类型，保持与 `shared-vue` 的 `Readonly<Ref<...>>` 一致。
 */
type PageLocaleVersion = ReturnType<typeof useLocaleVersionHook>;

/**
 * 订阅并返回 page 语言版本号。
 * @description 语言资源更新后返回值会变化，可用于触发依赖语言的重渲染。
 * @returns 当前语言版本号。
 */
export function useLocaleVersion(): PageLocaleVersion {
  return useLocaleVersionHook();
}
