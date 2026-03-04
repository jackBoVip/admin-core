/**
 * Tabs Vue 初始化入口。
 * @description 封装 tabs-shared setup 运行时，提供 Vue 侧全局默认项安装能力。
 */
import {
  createAdminTabsAdapterSetupRuntime,
} from '@admin-core/tabs-shared';

import type {
  AdminTabsVueProps,
  SetupAdminTabsVueOptions,
} from './types';

/**
 * Vue 端 Tabs 适配层 setup 运行时。
 * @description 统一承载 core 初始化与默认 props 合并逻辑。
 */
const setupRuntime = createAdminTabsAdapterSetupRuntime<
  AdminTabsVueProps,
  SetupAdminTabsVueOptions
>();

/**
 * 初始化 Vue 端 AdminTabs 全局默认配置。
 * @param options 初始化选项，会与已有配置合并。
 * @returns 当前生效的 setup 状态快照。
 */
export function setupAdminTabsVue(
  options: SetupAdminTabsVueOptions = {}
) {
  return setupRuntime.setup(options);
}

/**
 * 读取 Vue 端 AdminTabs 全局 setup 状态。
 * @returns 当前保存的 setup 状态。
 */
export function getAdminTabsVueSetupState() {
  return setupRuntime.getSetupState();
}
