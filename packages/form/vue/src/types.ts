import type { Component } from 'vue';

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

export interface VueAdapterInput extends AdapterLibraryInput<Component> {}

export type SetupAdminFormVueOptions = SetupFormAdaptersOptions<
  Component,
  VueAdapterInput
>;

export type RegisterVueFormComponentsOptions =
  RegisterFormAdapterComponentsOptions;

export interface AdminFormComponentProps extends AdminFormProps {
  formApi?: AdminFormApi;
  onValuesChange?: (values: Record<string, any>) => void;
  values?: Record<string, any>;
  visibleFieldNames?: string[];
}

export interface AdminFormSubmitPageVueProps extends AdminFormSubmitPageBaseProps {
  formApi?: AdminFormApi;
}

export type UseAdminFormSubmitPageOptions = Omit<
  AdminFormSubmitPageVueProps,
  'formApi' | 'open'
> & {
  open?: boolean;
};

export type UseAdminFormSubmitPageComponentProps = Partial<
  AdminFormSubmitPageVueProps
>;

export type UseAdminFormSubmitPageReturn = readonly [
  Component<UseAdminFormSubmitPageComponentProps>,
  AdminFormApi,
  AdminFormSubmitPageController,
];

export type VueAdapter = FormAdapterV1<Component>;

export type FormAdapterInput = VueAdapterInput;
export type SetupAdminFormOptions = SetupAdminFormVueOptions;
export type RegisterFormComponentsOptions = RegisterVueFormComponentsOptions;
export type AdminFormUIProps = AdminFormComponentProps;
export type AdminFormSubmitPageProps = AdminFormSubmitPageVueProps;
export type AdminFormSubmitController = AdminFormSubmitPageController;
