/**
 * Form React 类型定义。
 * @description 汇总 React 适配层输入、组件属性、提交页与兼容别名类型。
 */
import type {
  AdapterLibraryInput,
  AdminFormApi,
  AdminFormProps,
  AdminFormSubmitPageBaseProps,
  AdminFormSubmitPageController,
  FormAdapterV1,
  RegisterFormAdapterComponentsOptions,
  SetupFormAdaptersOptions,
} from '@admin-core/form-core';
import type { ComponentType } from 'react';

/**
 * React 适配器输入结构。
 * @description 约束 React 组件库在表单适配桥中的输入格式。
 */
export interface ReactAdapterInput
  extends AdapterLibraryInput<ComponentType<any>> {}

/**
 * React 表单适配层 setup 选项。
 * @description 透传到 form-core 适配器初始化流程。
 */
export type SetupAdminFormReactOptions = SetupFormAdaptersOptions<
  ComponentType<any>,
  ReactAdapterInput
>;

/**
 * React 组件注册选项。
 * @description 控制组件映射注册时的覆盖策略等行为。
 */
export type RegisterReactFormComponentsOptions =
  RegisterFormAdapterComponentsOptions;

/**
 * React 表单组件 props。
 * @description 在 `AdminFormProps` 基础上补充受控与外部 API 注入能力。
 */
export interface AdminFormReactProps extends AdminFormProps {
  /** 外部传入表单 API。 */
  formApi?: AdminFormApi;
  /** 表单值变化时触发。 */
  onValuesChange?: (values: Record<string, any>) => void;
  /** 外部受控值。 */
  values?: Record<string, any>;
  /** 强制可见字段名列表。 */
  visibleFieldNames?: string[];
}

/**
 * React 提交页组件 props。
 * @description 在提交页基础 props 上支持外部注入 formApi。
 */
export interface AdminFormSubmitPageReactProps extends AdminFormSubmitPageBaseProps {
  /** 外部传入表单 API。 */
  formApi?: AdminFormApi;
}

/**
 * `useAdminFormSubmitPage` 选项。
 * @description 基于组件 props 衍生，移除外部注入 `formApi` 与受控 `open`。
 */
export type UseAdminFormSubmitPageOptions = Omit<
  AdminFormSubmitPageReactProps,
  'formApi' | 'open'
> & {
  /** 初始打开状态。 */
  open?: boolean;
};

/**
 * 提交页组件可选 props。
 * @description 供 Hook 返回组件外部按需覆盖，未传字段沿用 Hook 初始化配置。
 */
export type UseAdminFormSubmitPageComponentProps = Partial<
  AdminFormSubmitPageReactProps
>;

/**
 * `useAdminFormSubmitPage` 返回值类型。
 * @description 依次为：提交页组件、表单 API、提交页控制器。
 */
export type UseAdminFormSubmitPageReturn = readonly [
  ComponentType<UseAdminFormSubmitPageComponentProps>,
  AdminFormApi,
  AdminFormSubmitPageController,
];

/**
 * React 适配器类型别名。
 * @description 统一表示基于 React `ComponentType` 的表单适配器协议结构。
 */
export type ReactAdapter = FormAdapterV1<ComponentType<any>>;

/**
 * 兼容旧命名的适配器输入类型。
 * @description 为历史 API 保留的别名，建议新项目改用 `ReactAdapterInput`。
 */
export type FormAdapterInput = ReactAdapterInput;
/**
 * 兼容旧命名的 setup 选项类型。
 * @description 为历史 API 保留的别名，建议新项目改用 `SetupAdminFormReactOptions`。
 */
export type SetupAdminFormOptions = SetupAdminFormReactOptions;
/**
 * 兼容旧命名的组件注册选项类型。
 * @description 为历史 API 保留的别名，建议新项目改用 `RegisterReactFormComponentsOptions`。
 */
export type RegisterFormComponentsOptions = RegisterReactFormComponentsOptions;
/**
 * 兼容旧命名的表单 props 类型。
 * @description 为历史 API 保留的别名，建议新项目改用 `AdminFormReactProps`。
 */
export type AdminFormUIProps = AdminFormReactProps;
/**
 * 兼容旧命名的提交页 props 类型。
 * @description 为历史 API 保留的别名，建议新项目改用 `AdminFormSubmitPageReactProps`。
 */
export type AdminFormSubmitPageProps = AdminFormSubmitPageReactProps;
/**
 * 兼容旧命名的提交页控制器类型。
 * @description 为历史 API 保留的别名，建议新项目改用 `AdminFormSubmitPageController`。
 */
export type AdminFormSubmitController = AdminFormSubmitPageController;
