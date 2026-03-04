/**
 * Table Vue 语言版本 Composable。
 * @description 基于 shared-vue 版本订阅能力，监听 table-core 语言变更版本号。
 */
import {
  getLocaleVersion,
  subscribeLocaleChange,
} from '@admin-core/table-core';
import { createUseLocaleVersionHook } from '@admin-core/shared-vue';

/** 表格语言版本订阅 Hook 实例。 */
const useLocaleVersionHook = createUseLocaleVersionHook(
  getLocaleVersion,
  subscribeLocaleChange
);

/**
 * 表格语言版本订阅返回值类型。
 * @description 复用工厂 Hook 返回类型，保持与 `shared-vue` 的 `Readonly<Ref<...>>` 一致。
 */
type TableLocaleVersion = ReturnType<typeof useLocaleVersionHook>;

/**
 * 订阅表格语言版本变化。
 * @returns 当前语言版本号。
 */
export function useLocaleVersion(): TableLocaleVersion {
  return useLocaleVersionHook();
}
