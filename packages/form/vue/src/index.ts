/**
 * @admin-core/form-vue
 * Vue 3 UI adapter for @admin-core/form-core
 */

import './styles/index.css';

export * from '@admin-core/form-shared';

export { AdminForm } from './components/AdminForm';
export { AdminSearchForm } from './components/AdminSearchForm';
export { AdminFormSubmitPage } from './components/AdminFormSubmitPage';
export { useAdminForm } from './hooks/use-admin-form';
export { useAdminFormSubmitPage } from './hooks/use-admin-form-submit-page';
export {
  getFormAdapterRegistry,
  getVueFormAdapterRegistry,
  registerFormComponents,
  setupAdminForm,
  setupAdminFormVue,
} from './registry';

export type {
  AdminFormComponentProps,
  AdminFormSubmitPageProps,
  AdminFormSubmitPageVueProps,
  AdminFormUIProps,
  FormAdapterInput,
  RegisterFormComponentsOptions,
  RegisterVueFormComponentsOptions,
  SetupAdminFormOptions,
  SetupAdminFormVueOptions,
  UseAdminFormSubmitPageOptions,
  VueAdapter,
  VueAdapterInput,
} from './types';
