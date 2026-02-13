import type { AdminFormApi } from './api';
import type { ZodTypeAny } from 'zod';


export type FormLayout = 'horizontal' | 'inline' | 'vertical';

export type SemanticFormComponentType =
  | 'checkbox'
  | 'checkbox-group'
  | 'date'
  | 'date-range'
  | 'default-button'
  | 'input'
  | 'password'
  | 'primary-button'
  | 'radio'
  | 'radio-group'
  | 'range'
  | 'section-title'
  | 'select'
  | 'switch'
  | 'textarea'
  | 'time';

export type AdminFormComponentType =
  | SemanticFormComponentType
  | (Record<never, never> & string);

export type MaybeAsync<T> = Promise<T> | T;

export interface FormDependencyContext {
  fieldName: string;
  signal: AbortSignal;
  version: number;
}

export interface FormSubmitContext {
  signal: AbortSignal;
  version: number;
}

export interface FormRuleContext {
  fieldName: string;
  label: string;
  signal?: AbortSignal;
  values: Record<string, any>;
  version?: number;
}

export type FormRuleValidator = (
  value: any,
  params: any,
  context: FormRuleContext
) => MaybeAsync<boolean | string>;

export type FormSchemaRuleType =
  | FormRuleValidator
  | 'required'
  | 'selectRequired'
  | ZodTypeAny
  | null
  | (Record<never, never> & string);

export type MaybeComponentProps = Record<string, any>;

export type ComponentPropsGetter = (
  values: Record<string, any>,
  api: AdminFormApi,
  context?: FormDependencyContext
) => MaybeAsync<MaybeComponentProps>;

export type ComponentPropsInput = ComponentPropsGetter | MaybeComponentProps;

export interface FormFieldOptions {
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  validateOnInput?: boolean;
  validateOnModelUpdate?: boolean;
}

type FormDependencyPredicate<T> = (
  values: Record<string, any>,
  api: AdminFormApi,
  context?: FormDependencyContext
) => MaybeAsync<T>;

export interface AdminFormDependencies {
  componentProps?: FormDependencyPredicate<MaybeComponentProps>;
  disabled?: boolean | FormDependencyPredicate<boolean>;
  if?: boolean | FormDependencyPredicate<boolean>;
  required?: FormDependencyPredicate<boolean>;
  rules?: FormDependencyPredicate<FormSchemaRuleType>;
  show?: boolean | FormDependencyPredicate<boolean>;
  trigger?: FormDependencyPredicate<void>;
  triggerFields: string[];
}

export interface AdminFormCommonConfig {
  colon?: boolean;
  componentProps?: ComponentPropsInput;
  controlClass?: string;
  disabled?: boolean;
  disabledOnChangeListener?: boolean;
  disabledOnInputListener?: boolean;
  emptyStateValue?: null | undefined;
  formFieldProps?: FormFieldOptions;
  formItemClass?: (() => string) | string;
  hideLabel?: boolean;
  hideRequiredMark?: boolean;
  labelAlign?: 'left' | 'right';
  labelClass?: string;
  labelWidth?: number;
  modelPropName?: string;
  wrapperClass?: string;
}

export type CustomRenderType = string | (() => string);

export interface AdminFormSchema extends AdminFormCommonConfig {
  component: AdminFormComponentType | any;
  componentProps?: ComponentPropsInput;
  defaultValue?: any;
  dependencies?: AdminFormDependencies;
  description?: CustomRenderType;
  fieldName: string;
  formFieldProps?: FormFieldOptions;
  help?: CustomRenderType;
  hide?: boolean;
  label?: CustomRenderType;
  renderComponentContent?: (
    values: Record<string, any>,
    api: AdminFormApi
  ) => Record<string, any>;
  rules?: FormSchemaRuleType;
  suffix?: CustomRenderType;
}

export type FieldMappingTime = [
  string,
  [string, string],
  (
    | ((value: any, fieldName: string) => any)
    | [string, string]
    | null
    | string
  )?,
][];

export type ArrayToStringFields = Array<
  | [string[], string?]
  | string
  | string[]
>;

export interface ActionButtonOptions {
  [key: string]: any;
  content?: string;
  show?: boolean;
}

export interface AdminFormProps extends Omit<AdminFormCommonConfig, 'componentProps'> {
  actionButtonsReverse?: boolean;
  actionLayout?: 'inline' | 'newLine' | 'rowEnd';
  actionPosition?: 'center' | 'left' | 'right';
  actionWrapperClass?: string;
  arrayToStringFields?: ArrayToStringFields;
  collapsed?: boolean;
  collapsedRows?: number;
  collapseTriggerResize?: boolean;
  commonConfig?: AdminFormCommonConfig;
  compact?: boolean;
  fieldMappingTime?: FieldMappingTime;
  handleCollapsedChange?: (collapsed: boolean) => void;
  handleReset?: (
    values: Record<string, any>,
    context?: FormSubmitContext
  ) => MaybeAsync<void>;
  handleSubmit?: (
    values: Record<string, any>,
    context?: FormSubmitContext
  ) => MaybeAsync<void>;
  handleValuesChange?: (
    values: Record<string, any>,
    fieldsChanged: string[]
  ) => void;
  gridColumns?: number;
  layout?: FormLayout;
  queryMode?: boolean;
  resetButtonOptions?: ActionButtonOptions;
  schema?: AdminFormSchema[];
  scrollToFirstError?: boolean;
  showCollapseButton?: boolean;
  showDefaultActions?: boolean;
  submitButtonOptions?: ActionButtonOptions;
  submitOnChange?: boolean;
  submitOnEnter?: boolean;
  visibleFieldNames?: string[];
  wrapperClass?: string;
}

export interface RuntimeFieldState {
  dynamicComponentProps: MaybeComponentProps;
  dynamicFieldComponentProps: MaybeComponentProps;
  dynamicRules?: FormSchemaRuleType;
  evaluating: boolean;
  isDisabled: boolean;
  isIf: boolean;
  isRequired: boolean;
  isShow: boolean;
}
