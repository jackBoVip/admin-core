/**
 * @admin-core/page-react
 * React page adapter for @admin-core/page-core
 */

import './styles/index.css';

export * from '@admin-core/page-shared';

export { AdminPage } from './components/AdminPage';
export {
  AdminPageQueryTable,
  createAdminPageQueryTableApi,
} from './components/AdminPageQueryTable';
export { useAdminPage } from './hooks';
export { useAdminPageQueryTable } from './hooks';
export { getAdminPageReactSetupState, setupAdminPageReact } from './setup';
export {
  createFormApi,
  setupAdminFormReact,
  type AdminFormApi,
  type AdminFormProps,
  type SetupAdminFormReactOptions,
} from '@admin-core/form-react';
export {
  createTableApi,
  setupAdminTableReact,
  type AdminTableApi,
  type AdminTableReactProps,
  type SetupAdminTableReactOptions,
} from '@admin-core/table-react';

export type {
  AdminPageQueryTableApi,
  AdminPageQueryTableReactProps,
  AdminPageReactItem,
  AdminPageReactProps,
  ExtendedAdminPageApi,
  ReactPageComponent,
  SetupAdminPageReactOptions,
  UseAdminPageQueryTableReturn,
} from './types';
