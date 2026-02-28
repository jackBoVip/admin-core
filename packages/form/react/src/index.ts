/**
 * @admin-core/form-react
 * React UI adapter for @admin-core/form-core
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
  getReactFormAdapterRegistry,
  registerFormComponents,
  setupAdminForm,
  setupAdminFormReact,
} from './registry';

export type {
  AdminFormUIProps,
  AdminFormReactProps,
  AdminFormSubmitPageProps,
  AdminFormSubmitPageReactProps,
  FormAdapterInput,
  RegisterFormComponentsOptions,
  ReactAdapter,
  ReactAdapterInput,
  RegisterReactFormComponentsOptions,
  SetupAdminFormOptions,
  SetupAdminFormReactOptions,
  UseAdminFormSubmitPageOptions,
} from './types';
