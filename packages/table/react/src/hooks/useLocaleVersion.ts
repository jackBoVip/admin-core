/**
 * Table React 语言版本 Hook。
 * @description 基于 shared-react 版本订阅能力，监听 table-core 语言变更版本号。
 */
import {
  getLocaleVersion,
  subscribeLocaleChange,
} from '@admin-core/table-core';
import { createUseLocaleVersionHook } from '@admin-core/shared-react';

/**
 * 表格语言版本订阅 Hook 工厂返回值。
 */
const useLocaleVersionHook = createUseLocaleVersionHook(
  getLocaleVersion,
  subscribeLocaleChange
);

/**
 * 表格语言版本值类型。
 * @description 与 `table-core` 返回值保持一致，避免手写重复类型。
 */
type TableLocaleVersion = ReturnType<typeof getLocaleVersion>;

/**
 * 订阅表格语言版本变化。
 * @returns 当前语言版本号。
 */
export function useLocaleVersion(): TableLocaleVersion {
  return useLocaleVersionHook();
}
