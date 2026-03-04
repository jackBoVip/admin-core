/**
 * React 版 Page 语言版本 Hook。
 * @description 封装 page-core 语言版本订阅能力，为组件提供轻量重渲染触发信号。
 */

import {
  getLocaleVersion,
  subscribeLocaleChange,
} from '@admin-core/page-core';
import { createUseLocaleVersionHook } from '@admin-core/shared-react';

/**
 * Page 语言版本订阅 Hook 工厂返回值。
 */
const useLocaleVersionHook = createUseLocaleVersionHook(
  getLocaleVersion,
  subscribeLocaleChange
);

/**
 * Page 语言版本值类型。
 * @description 与 `page-core` 返回值保持一致，避免手写重复类型。
 */
type PageLocaleVersion = ReturnType<typeof getLocaleVersion>;

/**
 * 订阅并返回 page 语言版本号。
 * @description 当语言包更新时版本号会变化，可用于触发依赖该值的重渲染。
 * @returns 当前语言版本号。
 */
export function useLocaleVersion(): PageLocaleVersion {
  return useLocaleVersionHook();
}
