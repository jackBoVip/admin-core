/**
 * @admin-core/table-vue
 * Vue 3 table adapter for @admin-core/table-core
 */

import './styles/index.css';

export * from '@admin-core/table-shared';

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
