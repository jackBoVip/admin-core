import type {
  AdminFormProps,
  AdminFormSchema,
  FormRuleValidator,
  FormSchemaRuleType,
  RuntimeFieldState,
} from './schema';
import type { StoreApi } from './store';

export interface FieldValidationResult {
  error?: string;
  valid: boolean;
}

export interface FormValidationResult {
  errors: Record<string, string>;
  valid: boolean;
  values: Record<string, any>;
}

export interface RenderFieldItem extends AdminFormSchema {
  commonComponentProps: Record<string, any>;
  hiddenByCollapse: boolean;
  runtime: RuntimeFieldState;
  rules?: FormSchemaRuleType;
}

export interface FormRenderState {
  collapsed: boolean;
  fields: RenderFieldItem[];
}

export interface AdminFormSnapshot {
  errors: Record<string, string>;
  latestSubmissionValues: Record<string, any> | null;
  props: AdminFormProps;
  runtime: Record<string, RuntimeFieldState>;
  values: Record<string, any>;
}

export interface AdminFormApi {
  form: {
    errors: Record<string, string>;
    values: Record<string, any>;
  };
  getFieldComponentRef<T = unknown>(fieldName: string): T | undefined;
  getFocusedField(): string | undefined;
  getLatestSubmissionValues(): Record<string, any>;
  getRenderState(): FormRenderState;
  getSnapshot(): AdminFormSnapshot;
  getState(): AdminFormProps;
  getValues<T = Record<string, any>>(): Promise<T>;
  isFieldValid(fieldName: string): Promise<boolean>;
  merge(formApi: AdminFormApi): AdminFormApi & {
    merge(nextFormApi: AdminFormApi): any;
    submitAllForm(needMerge?: boolean): Promise<Record<string, any> | Record<string, any>[] | undefined>;
  };
  mount(): void;
  registerFieldComponentRef(fieldName: string, ref: unknown): void;
  removeFieldComponentRef(fieldName: string): void;
  removeSchemaByFields(fields: string[]): Promise<void>;
  resetForm(values?: Partial<Record<string, any>>): Promise<void>;
  resetValidate(): Promise<void>;
  setFieldValue(field: string, value: any, shouldValidate?: boolean): Promise<void>;
  setLatestSubmissionValues(values: null | Record<string, any>): void;
  setState(
    stateOrFn:
      | ((prev: AdminFormProps) => Partial<AdminFormProps>)
      | Partial<AdminFormProps>
  ): void;
  setValues(
    fields: Record<string, any>,
    filterFields?: boolean,
    shouldValidate?: boolean
  ): Promise<void>;
  store: StoreApi<AdminFormSnapshot>;
  submitForm(event?: Event): Promise<Record<string, any>>;
  unmount(): void;
  updateSchema(schema: Partial<AdminFormSchema>[]): void;
  validate(): Promise<FormValidationResult>;
  validateAndSubmitForm(): Promise<Record<string, any> | undefined>;
  validateField(fieldName: string): Promise<FieldValidationResult>;
}

export interface RegisterFormRulesOptions {
  [ruleName: string]: FormRuleValidator;
}

export interface SetupAdminFormCoreOptions {
  locale?: string;
  logLevel?: 'error' | 'info' | 'silent' | 'warn';
  rules?: RegisterFormRulesOptions;
}
