/**
 * @admin-core/page-vue
 * Vue 3 page adapter for @admin-core/page-core
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
export { getAdminPageVueSetupState, setupAdminPageVue } from './setup';
export {
  createFormApi,
  setupAdminFormVue,
  type AdminFormApi,
  type AdminFormProps,
  type SetupAdminFormVueOptions,
} from '@admin-core/form-vue';
export {
  createTableApi,
  setupAdminTableVue,
  type AdminTableApi,
  type AdminTableVueProps,
  type SetupAdminTableVueOptions,
} from '@admin-core/table-vue';

export type {
  AdminPageQueryTableApi,
  AdminPageQueryTableVueProps,
  AdminPageVueItem,
  AdminPageVueProps,
  ExtendedAdminPageApi,
  SetupAdminPageVueOptions,
  UseAdminPageQueryTableReturn,
  VuePageComponent,
} from './types';
