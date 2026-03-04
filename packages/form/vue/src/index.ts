/**
 * @admin-core/form-vue
 * Vue 3 表单 UI 适配层（基于 @admin-core/form-core）
 * @description 提供 Vue 表单组件、Composable 能力与适配器注册/初始化能力。
 */

import './styles/index.css';

/**
 * 导出跨框架共享的 form-shared 能力。
 * @description 包含 form-core API、setup 运行时与通用类型。
 */
export * from '@admin-core/form-shared';

/**
 * 导出 Vue 表单组件、Hook 与运行时注册能力。
 * @description 覆盖通用表单、查询表单、提交页以及初始化入口。
 */
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

/**
 * 导出 Vue 侧类型定义。
 * @description 聚合 Vue 适配输入、组件属性与提交页 Composable 类型。
 */
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
