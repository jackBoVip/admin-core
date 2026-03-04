/**
 * tabs-shared 导出入口。
 * @description 汇总 tabs-core 能力与跨框架共享 setup/类型能力。
 */
export {
  createAdminTabsChangePayload,
  createAdminTabsClosePayload,
  DEFAULT_ADMIN_TABS_OPTIONS,
  getAdminTabsCoreSetupState,
  getAdminTabsLocale,
  getAdminTabsLocaleVersion,
  normalizeAdminTabsOptions,
  resolveAdminTabsOptionsWithDefaults,
  resolveAdminTabsActiveItem,
  resolveAdminTabsActiveKey,
  resolveAdminTabsCssLength,
  resolveAdminTabsItemsSignature,
  resolveAdminTabsRootClassNames,
  resolveAdminTabsSelectedActiveKey,
  resolveAdminTabsShowClose,
  resolveAdminTabsStyleVars,
  resolveAdminTabsUncontrolledActiveKey,
  resolveAdminTabsVisible,
  setAdminTabsLocale,
  setupAdminTabsCore,
  subscribeAdminTabsLocale,
  type AdminTabItem,
  type AdminTabsLocale,
  type AdminTabsOptions,
  type NormalizedAdminTabsOptions,
  type SetupAdminTabsCoreOptions,
} from '@admin-core/tabs-core';

/**
 * 导出跨框架共享的 setup 能力与适配层类型。
 * @description 提供 React/Vue 共用的初始化状态与适配器类型。
 */
export * from './setup';
export * from './types';
