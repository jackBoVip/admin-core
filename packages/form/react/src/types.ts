import type {
  AdapterLibraryInput,
  AdminFormApi,
  AdminFormProps,
  AdminFormSubmitPageController,
  AdminFormSubmitPageBaseProps,
  FormAdapterV1,
  RegisterFormAdapterComponentsOptions,
  SetupFormAdaptersOptions,
} from '@admin-core/form-core';
import type { ComponentType } from 'react';


export interface ReactAdapterInput
  extends AdapterLibraryInput<ComponentType<any>> {}

export type SetupAdminFormReactOptions = SetupFormAdaptersOptions<
  ComponentType<any>,
  ReactAdapterInput
>;

export type RegisterReactFormComponentsOptions =
  RegisterFormAdapterComponentsOptions;

export interface AdminFormReactProps extends AdminFormProps {
  formApi?: AdminFormApi;
  onValuesChange?: (values: Record<string, any>) => void;
  values?: Record<string, any>;
  visibleFieldNames?: string[];
}

export interface AdminFormSubmitPageReactProps extends AdminFormSubmitPageBaseProps {
  formApi?: AdminFormApi;
}

export type UseAdminFormSubmitPageOptions = Omit<
  AdminFormSubmitPageReactProps,
  'formApi' | 'open'
> & {
  open?: boolean;
};

export type UseAdminFormSubmitPageComponentProps = Partial<
  AdminFormSubmitPageReactProps
>;

export type UseAdminFormSubmitPageReturn = readonly [
  ComponentType<UseAdminFormSubmitPageComponentProps>,
  AdminFormApi,
  AdminFormSubmitPageController,
];

export type ReactAdapter = FormAdapterV1<ComponentType<any>>;

export type FormAdapterInput = ReactAdapterInput;
export type SetupAdminFormOptions = SetupAdminFormReactOptions;
export type RegisterFormComponentsOptions = RegisterReactFormComponentsOptions;
export type AdminFormUIProps = AdminFormReactProps;
export type AdminFormSubmitPageProps = AdminFormSubmitPageReactProps;
export type AdminFormSubmitController = AdminFormSubmitPageController;
