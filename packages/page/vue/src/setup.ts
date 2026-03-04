/**
 * Page Vue 适配层全局初始化入口。
 * @description 统一协调 form/table 子模块 setup，并暴露当前 setup 状态读取能力。
 */

import { setupAdminFormVue } from '@admin-core/form-vue';
import type { SetupAdminFormVueOptions } from '@admin-core/form-vue';
import {
  createPageAdapterSetupRuntime,
} from '@admin-core/page-shared';
import { setupAdminTableVue } from '@admin-core/table-vue';
import type { SetupAdminTableVueOptions } from '@admin-core/table-vue';

import type { SetupAdminPageVueOptions } from './types';

/**
 * Page Vue 适配层 setup 运行时。
 * @description 统一承载 form/table 子模块 setup 能力与状态。
 */
const setupRuntime = createPageAdapterSetupRuntime<
  SetupAdminFormVueOptions,
  SetupAdminTableVueOptions
>({
  setupForm: setupAdminFormVue,
  setupTable: setupAdminTableVue,
});

/**
 * 初始化 Vue 版 Page 组合包的全局默认配置。
 * @param options 初始化选项，会传递给 form/table 对应 setup。
 * @returns 无返回值。
 */
export function setupAdminPageVue(options: SetupAdminPageVueOptions = {}) {
  setupRuntime.setup(options);
}

/**
 * 读取 Vue 版 Page 组合包的全局 setup 状态。
 * @returns 当前保存的 setup 状态。
 */
export function getAdminPageVueSetupState() {
  return setupRuntime.getSetupState();
}
