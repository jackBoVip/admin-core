/**
 * @admin-core/form-react
 * React UI adapter for @admin-core/form-core
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
