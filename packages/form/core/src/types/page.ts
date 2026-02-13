import type { AdminFormApi } from './api';
import type {
  AdminFormProps,
  AdminFormSchema,
  FormSubmitContext,
  MaybeAsync,
} from './schema';

export type AdminFormContainerMode = 'drawer' | 'modal';

export type AdminFormDrawerPlacement = 'left' | 'right';

export type AdminFormStepDirection = 'backward' | 'forward' | 'none';

export type AdminFormStepAnimation = 'fade' | 'slide';

export interface AdminFormSectionSchema {
  description?: string;
  key?: string;
  schema: AdminFormSchema[];
  title?: string;
}

export interface AdminFormStepSchema {
  columns?: number;
  description?: string;
  key?: string;
  schema?: AdminFormSchema[];
  sections?: AdminFormSectionSchema[];
  title: string;
}

export interface ResolvedAdminFormSectionSchema extends AdminFormSectionSchema {
  columns: number;
  fieldNames: string[];
  key: string;
  schema: AdminFormSchema[];
  stepIndex: number;
}

export interface ResolvedAdminFormStepSchema extends AdminFormStepSchema {
  columns: number;
  fieldNames: string[];
  key: string;
  sections: ResolvedAdminFormSectionSchema[];
}

export interface BuildSteppedFormSchemaOptions {
  includeSectionDivider?: boolean;
  initialStep?: number;
  rowColumns?: number;
  sectionComponent?: string;
  stepFieldName?: string;
}

export interface BuildSteppedFormSchemaResult {
  schema: AdminFormSchema[];
  stepFieldName: string;
  steps: ResolvedAdminFormStepSchema[];
}

export interface ValidateFormFieldsResult {
  errors: Record<string, string>;
  valid: boolean;
}

export interface ValidateSteppedFormResult extends ValidateFormFieldsResult {
  firstInvalidStep: number;
}

export interface AdminFormStepChangePayload {
  direction: AdminFormStepDirection;
  nextStep: number;
  previousStep: number;
  step: ResolvedAdminFormStepSchema;
}

export interface AdminFormSteppedSubmitContext extends FormSubmitContext {
  activeStep: number;
  api: AdminFormApi;
}

export type AdminFormSteppedSubmitHandler = (
  values: Record<string, any>,
  context: AdminFormSteppedSubmitContext
) => MaybeAsync<boolean | void>;

export type AdminFormSubmitPageNextResult =
  | { status: 'blocked' }
  | { nextStep: number; status: 'moved' }
  | { status: 'submitted'; values: Record<string, any> };

export interface AdminFormSubmitPageController {
  close: () => void;
  getStep: () => number;
  getTotalSteps: () => number;
  getFormApi: () => AdminFormApi;
  getOpen: () => boolean;
  goToStep: (step: number) => Promise<number>;
  next: () => Promise<AdminFormSubmitPageNextResult>;
  open: () => void;
  prev: () => Promise<boolean>;
  setOpen: (open: boolean) => void;
  toggle: (open?: boolean) => void;
}

export interface AdminFormSubmitPageBaseProps
  extends Omit<AdminFormProps, 'schema' | 'showDefaultActions'> {
  animation?: AdminFormStepAnimation;
  cancelText?: string;
  description?: string;
  destroyOnClose?: boolean;
  drawerPlacement?: AdminFormDrawerPlacement;
  initialStep?: number;
  maskClosable?: boolean;
  mode?: AdminFormContainerMode;
  nextText?: string;
  onCancel?: () => void;
  onOpenChange?: (open: boolean) => void;
  onStepChange?: (payload: AdminFormStepChangePayload) => void;
  onSubmit?: AdminFormSteppedSubmitHandler;
  open: boolean;
  prevText?: string;
  resetOnClose?: boolean;
  resetOnSubmit?: boolean;
  rowColumns?: number;
  showStepHeader?: boolean;
  stepFieldName?: string;
  stepDurationMs?: number;
  steps: AdminFormStepSchema[];
  submitText?: string;
  title?: string;
  width?: number | string;
}
