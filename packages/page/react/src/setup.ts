/**
 * Page React 适配层全局初始化入口。
 * @description 统一协调 form/table 子模块 setup，并暴露当前 setup 状态读取能力。
 */

import { setupAdminFormReact } from '@admin-core/form-react';
import type { SetupAdminFormReactOptions } from '@admin-core/form-react';
import {
  createPageAdapterSetupRuntime,
} from '@admin-core/page-shared';
import { setupAdminTableReact } from '@admin-core/table-react';
import type { SetupAdminTableReactOptions } from '@admin-core/table-react';

import type { SetupAdminPageReactOptions } from './types';

/**
 * Page React 适配层 setup 运行时。
 * @description 统一承载 form/table 子模块 setup 能力与状态。
 */
const setupRuntime = createPageAdapterSetupRuntime<
  SetupAdminFormReactOptions,
  SetupAdminTableReactOptions
>({
  setupForm: setupAdminFormReact,
  setupTable: setupAdminTableReact,
});

/**
 * 初始化 React 版 Page 组合包的全局默认配置。
 * @param options 初始化选项，会传递给 form/table 对应 setup。
 * @returns 无返回值。
 */
export function setupAdminPageReact(options: SetupAdminPageReactOptions = {}) {
  setupRuntime.setup(options);
}

/**
 * 读取 React 版 Page 组合包的全局 setup 状态。
 * @returns 当前保存的 setup 状态。
 */
export function getAdminPageReactSetupState() {
  return setupRuntime.getSetupState();
}
