/**
 * @admin-core/table-react
 * React table adapter for @admin-core/table-core
 */

import './styles/index.css';

export * from '@admin-core/table-shared';

export { AdminTable } from './components';
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
export { useAdminTable, useLocaleVersion } from './hooks';

export type {
  AdminTableReactProps,
  AdminTableSlots,
  AntdGridOptions,
  AntdTableColumn,
  ExtendedAdminTableApi,
  SetupAdminTableReactOptions,
} from './types';
