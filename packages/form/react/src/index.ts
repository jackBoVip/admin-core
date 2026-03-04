/**
 * @admin-core/form-react
 * React 表单 UI 适配层（基于 @admin-core/form-core）
 * @description 提供 React 表单组件、Hook 能力与适配器注册/初始化能力。
 */

import './styles/index.css';

/**
 * 导出跨框架共享的 form-shared 能力。
 * @description 包含 form-core API、setup 运行时与通用类型。
 */
export * from '@admin-core/form-shared';

/**
 * 导出 React 表单组件、Hook 与运行时注册能力。
 * @description 覆盖通用表单、查询表单、提交页以及初始化入口。
 */
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

/**
 * 导出 React 侧类型定义。
 * @description 聚合 React 适配输入、组件属性与提交页 Hook 类型。
 */
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
