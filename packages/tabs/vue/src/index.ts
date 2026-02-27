/**
 * @admin-core/tabs-vue
 * Vue 3 tabs adapter for @admin-core/tabs-core
 */

import './styles/index.css';

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

export { AdminTabs } from './components';
export { getAdminTabsVueSetupState, setupAdminTabsVue } from './setup';

export type {
  AdminTabVueItem,
  AdminTabsChangePayload,
  AdminTabsClosePayload,
  AdminTabsVueProps,
  SetupAdminTabsVueOptions,
} from './types';
