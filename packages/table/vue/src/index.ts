/**
 * @admin-core/table-vue
 * Vue 3 table adapter for @admin-core/table-core
 */

import './styles/index.css';

export {
  createTableApi,
  extendProxyOptions,
  getGlobalTableFormatterRegistry,
  getLocaleMessages,
  registerTableFormatters,
  resolveTableStripeConfig,
  setupAdminTableCore,
  type AdminTableGridEvents,
  type AdminTableApi,
  type AdminTableOptions,
  type AdminTableProps,
  type ColumnCustomChangePayload,
  type ColumnCustomSnapshot,
  type ColumnCustomState,
  type ProxyConfig,
  type SeparatorOptions,
  type TableStripeConfig,
  type TableFormatter,
  type TableRenderer,
  type ToolbarConfig,
} from '@admin-core/table-core';

export { default as AdminTable } from './components/AdminTable.vue';
export {
  getAdminTableVueSetupState,
  setupAdminTableVue,
  syncAdminTableVueWithPreferences,
} from './setup';
export { useAdminTable } from './hooks';
export { useLocaleVersion } from './composables/useLocaleVersion';
export { usePreferencesLocale } from './composables/usePreferencesLocale';

export type {
  AdminTableVueProps,
  ExtendedAdminTableApi,
  SetupAdminTableVueOptions,
  VxeTableGridOptions,
} from './types';
