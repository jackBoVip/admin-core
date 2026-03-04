/**
 * Form React 语言版本 Hook。
 * @description 基于 shared-react 版本订阅能力，监听 form-core 语言变更版本号。
 */
import {
  getLocaleVersion,
  subscribeLocaleChange,
} from '@admin-core/form-core';
import { createUseLocaleVersionHook } from '@admin-core/shared-react';

/**
 * Form 语言版本订阅 Hook 工厂返回值。
 */
const useLocaleVersionHook = createUseLocaleVersionHook(
  getLocaleVersion,
  subscribeLocaleChange
);

/**
 * Form 语言版本值类型。
 * @description 与 `form-core` 返回值保持一致，避免手写重复类型。
 */
type FormLocaleVersion = ReturnType<typeof getLocaleVersion>;

/**
 * 订阅并返回 form 语言版本号。
 * @description 语言资源更新后返回值会变化，可用于触发依赖语言的重渲染。
 * @returns 当前语言版本号。
 */
export function useLocaleVersion(): FormLocaleVersion {
  return useLocaleVersionHook();
}
