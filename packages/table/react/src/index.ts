/**
 * @admin-core/table-react
 * React table adapter for @admin-core/table-core
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

export { AdminTable } from './components';
export { useAdminTable } from './hooks';
export {
  getReactTableRenderer,
  getReactTableRendererRegistry,
  registerBuiltinReactRenderers,
  registerReactTableRenderer,
  removeReactTableRenderer,
} from './renderers';
export {
  getAdminTableReactSetupState,
  setupAdminTableReact,
  syncAdminTableReactWithPreferences,
} from './setup';

export type {
  AdminTableReactProps,
  AdminTableSlots,
  AntdGridOptions,
  AntdTableColumn,
  ExtendedAdminTableApi,
  SetupAdminTableReactOptions,
} from './types';
