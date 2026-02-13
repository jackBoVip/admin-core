/**
 * @admin-core/form-vue
 * Vue 3 UI adapter for @admin-core/form-core
 */

import './styles/index.css';

export { z } from '@admin-core/form-core';

export {
  createRangeRule,
  createFormApi,
  registerFormRules,
  setupAdminFormCore,
  type AdapterCapabilities,
  type AdminFormApi,
  type AdminFormCommonConfig,
  type AdminFormComponentType,
  type AdminFormDependencies,
  type AdminFormProps,
  type AdminFormSchema,
  type FieldMappingTime,
  type FormAdapterV1,
  type FormLayout,
  type FormRuleContext,
  type FormRuleValidator,
  type FormSchemaRuleType,
  type ResolvedComponentBinding,
  type SemanticFormComponentType,
} from '@admin-core/form-core';

export { AdminForm } from './components/AdminForm';
export { AdminSearchForm } from './components/AdminSearchForm';
export { AdminFormSubmitPage } from './components/AdminFormSubmitPage';
export { useAdminForm, useAdminFormSubmitPage } from './hooks';
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
