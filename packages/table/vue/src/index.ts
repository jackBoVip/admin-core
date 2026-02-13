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
  setupAdminTableCore,
  type AdminTableApi,
  type AdminTableOptions,
  type AdminTableProps,
  type ProxyConfig,
  type SeparatorOptions,
  type TableFormatter,
  type TableRenderer,
  type ToolbarConfig,
} from '@admin-core/table-core';

export { default as AdminTable } from './components/AdminTable.vue';
export { setupAdminTableVue } from './setup';
export { useAdminTable } from './hooks';

export type {
  AdminTableVueProps,
  ExtendedAdminTableApi,
  SetupAdminTableVueOptions,
  VxeTableGridOptions,
} from './types';
