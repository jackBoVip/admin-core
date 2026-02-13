import { pickFormProps } from './form-props-shared';
import {
  clampStepIndex,
  resolveStepDirection,
  resolveStepChangePayload,
  sanitizeSteppedFormValues,
  validateFormFields,
  validateSteppedForm,
} from './stepped-form';
import type {
  AdminFormApi,
  AdminFormStepAnimation,
  AdminFormStepChangePayload,
  AdminFormStepDirection,
  AdminFormProps,
  AdminFormSubmitPageController,
  AdminFormSubmitPageNextResult,
  AdminFormSchema,
  AdminFormSubmitPageBaseProps,
  AdminFormSteppedSubmitContext,
  AdminFormSteppedSubmitHandler,
  ResolvedAdminFormStepSchema,
} from '../types';


export function createSubmitPagePanelStyle(
  mode: AdminFormSubmitPageBaseProps['mode'],
  width: AdminFormSubmitPageBaseProps['width']
) {
  if (!width) {
    return undefined;
  }
  const resolvedWidth = typeof width === 'number' ? `${width}px` : width;
  if (mode === 'drawer') {
    return {
      maxWidth: 'none',
      width: resolvedWidth,
    };
  }
  return {
    '--admin-form-page-width': resolvedWidth,
    maxWidth: resolvedWidth,
    width: 'min(100%, var(--admin-form-page-width, 960px))',
  };
}

export function resolveSubmitPagePanelClassName(input: {
  drawerPlacement?: AdminFormSubmitPageBaseProps['drawerPlacement'];
  mode?: AdminFormSubmitPageBaseProps['mode'];
  open?: boolean;
}) {
  const mode = input.mode ?? 'modal';
  const drawerPlacement = input.drawerPlacement ?? 'right';
  return [
    'admin-form-page',
    `admin-form-page--${mode}`,
    mode === 'drawer' ? `admin-form-page--drawer-${drawerPlacement}` : '',
    input.open ? '' : 'admin-form-page--closed',
  ]
    .filter(Boolean)
    .join(' ');
}

export function resolveSubmitPageStepPanelClassName(input: {
  animation?: AdminFormStepAnimation;
  direction?: 'backward' | 'fade' | 'forward';
}) {
  if (input.animation === 'fade') {
    return 'admin-form-page__step-panel admin-form-page__step-panel--fade';
  }
  if (input.direction === 'backward') {
    return 'admin-form-page__step-panel admin-form-page__step-panel--backward';
  }
  return 'admin-form-page__step-panel admin-form-page__step-panel--forward';
}

export function resolveSubmitPageCloseResetPlan(input: {
  open: boolean;
  previousOpen: boolean;
  resetOnClose: boolean;
  skipAutoResetOnClose: boolean;
}) {
  if (!input.previousOpen || input.open || !input.resetOnClose) {
    return {
      nextSkipAutoResetOnClose: input.skipAutoResetOnClose,
      shouldReset: false,
    };
  }
  if (input.skipAutoResetOnClose) {
    return {
      nextSkipAutoResetOnClose: false,
      shouldReset: false,
    };
  }
  return {
    nextSkipAutoResetOnClose: false,
    shouldReset: true,
  };
}

export function resolveSubmitPagePrimaryActionLabel(input: {
  activeStep: number;
  nextText?: string;
  submitText?: string;
  totalSteps: number;
}): string | undefined {
  if (input.activeStep >= input.totalSteps - 1) {
    return input.submitText;
  }
  return input.nextText;
}

export function resolveSubmitPageViewState(input: {
  activeStep: number;
  rowColumns?: number;
  steps: ResolvedAdminFormStepSchema[];
}) {
  const totalSteps = input.steps.length;
  const activeStep = clampStepIndex(input.activeStep, totalSteps || 1);
  const currentStep = input.steps[activeStep];
  const currentColumns = currentStep?.columns ?? input.rowColumns ?? 1;
  return {
    activeStep,
    currentColumns,
    currentSections: currentStep?.sections ?? [],
    currentStep,
    isFirstStep: activeStep <= 0,
    isLastStep: activeStep >= totalSteps - 1,
    totalSteps,
  };
}

export function resolveSubmitPageStepItemState(input: {
  activeStep: number;
  index: number;
  step: ResolvedAdminFormStepSchema;
}) {
  const done = input.index < input.activeStep;
  const active = input.index === input.activeStep;
  const status = done ? 'done' : active ? 'active' : 'pending';
  const className = [
    'admin-form-page__step-item',
    active ? 'admin-form-page__step-item--active' : '',
    done ? 'admin-form-page__step-item--done' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return {
    className,
    direction: resolveStepDirection(input.activeStep, input.index) as AdminFormStepDirection,
    done,
    dotLabel: done ? '✓' : input.index + 1,
    status,
    step: input.step,
  };
}

export function resolveSubmitPageStepHeaderItems(input: {
  activeStep: number;
  steps: ResolvedAdminFormStepSchema[];
}) {
  const safeActiveStep = clampStepIndex(input.activeStep, input.steps.length || 1);
  return input.steps.map((step, index) => {
    const state = resolveSubmitPageStepItemState({
      activeStep: safeActiveStep,
      index,
      step,
    });
    return {
      ...state,
      index,
      key: step.key,
      title: step.title,
    };
  });
}

export function resolveSubmitPageFooterState(input: {
  activeStep: number;
  totalSteps: number;
}) {
  const safeActiveStep = clampStepIndex(input.activeStep, input.totalSteps || 1);
  return {
    isLastStep: safeActiveStep >= input.totalSteps - 1,
    previousDisabled: safeActiveStep <= 0,
    safeActiveStep,
    totalSteps: input.totalSteps,
  };
}

export function shouldShowSubmitPageStepHeader(
  showStepHeader: boolean | undefined,
  totalSteps: number
) {
  return (showStepHeader ?? true) && totalSteps > 1;
}

export function resolveSubmitPageDisplaySections(
  step: ResolvedAdminFormStepSchema | undefined
) {
  if (!step) {
    return [] as ResolvedAdminFormStepSchema['sections'];
  }
  return step.sections.filter((section) => !!(section.title || section.description));
}

export function resolveSubmitPageFormProps(
  props: AdminFormSubmitPageBaseProps,
  schema: AdminFormSchema[]
): AdminFormProps {
  const {
    animation: _animation,
    cancelText: _cancelText,
    description: _description,
    destroyOnClose: _destroyOnClose,
    drawerPlacement: _drawerPlacement,
    initialStep: _initialStep,
    maskClosable: _maskClosable,
    mode: _mode,
    nextText: _nextText,
    onCancel: _onCancel,
    onOpenChange: _onOpenChange,
    onStepChange: _onStepChange,
    onSubmit: _onSubmit,
    open: _open,
    prevText: _prevText,
    resetOnClose: _resetOnClose,
    resetOnSubmit: _resetOnSubmit,
    rowColumns: _rowColumns,
    showStepHeader: _showStepHeader,
    stepDurationMs: _stepDurationMs,
    stepFieldName: _stepFieldName,
    steps: _steps,
    submitText: _submitText,
    title: _title,
    width: _width,
    ...rest
  } = props;

  const safeFormProps = pickFormProps(rest as Record<string, any>);
  const resolvedGridColumns =
    safeFormProps.gridColumns ??
    (typeof props.rowColumns === 'number' ? props.rowColumns : undefined);

  return {
    ...safeFormProps,
    ...(resolvedGridColumns === undefined
      ? {}
      : { gridColumns: resolvedGridColumns }),
    schema,
    showDefaultActions: false,
  };
}

export function resolveSubmitPageSubmitHandler(
  props: Pick<AdminFormSubmitPageBaseProps, 'handleSubmit' | 'onSubmit'>
): AdminFormSteppedSubmitHandler | undefined {
  return props.onSubmit ?? props.handleSubmit;
}

export function createSteppedSubmitContext(
  api: AdminFormApi,
  activeStep: number
): AdminFormSteppedSubmitContext {
  return {
    activeStep,
    api,
    signal: new AbortController().signal,
    version: Date.now(),
  };
}

export async function syncSubmitPageStep(
  api: AdminFormApi,
  stepFieldName: string,
  step: number,
  shouldValidate = false
) {
  await api.setFieldValue(stepFieldName, step, shouldValidate);
}

export async function submitPagePrevStep(input: {
  activeStep: number;
  applyStepChange: (
    nextStep: number,
    steps: ResolvedAdminFormStepSchema[]
  ) => Promise<void>;
  steps: ResolvedAdminFormStepSchema[];
}) {
  if (input.activeStep <= 0) {
    return false;
  }
  await input.applyStepChange(input.activeStep - 1, input.steps);
  return true;
}

export async function submitPageNextStep(input: {
  activeStep: number;
  api: AdminFormApi;
  applyStepChange: (
    nextStep: number,
    steps: ResolvedAdminFormStepSchema[]
  ) => Promise<void>;
  onOpenChange?: (open: boolean) => void;
  stepFieldName: string;
  steps: ResolvedAdminFormStepSchema[];
  submitHandler?: AdminFormSteppedSubmitHandler;
}) {
  const totalSteps = input.steps.length;
  if (totalSteps <= 0) {
    return { status: 'blocked' as const };
  }
  const safeActiveStep = clampStepIndex(input.activeStep, totalSteps);
  const currentStep = input.steps[safeActiveStep];
  if (!currentStep) {
    return { status: 'blocked' as const };
  }

  const currentValidation = await validateFormFields(
    input.api,
    currentStep.fieldNames
  );
  if (!currentValidation.valid) {
    return { status: 'blocked' as const };
  }

  const nextStep = safeActiveStep + 1;
  if (nextStep < totalSteps) {
    await input.applyStepChange(nextStep, input.steps);
    return {
      nextStep,
      status: 'moved' as const,
    };
  }

  const allValidation = await validateSteppedForm(
    input.api,
    input.steps,
    input.stepFieldName,
    safeActiveStep
  );
  if (!allValidation.valid) {
    if (allValidation.firstInvalidStep >= 0) {
      await input.applyStepChange(allValidation.firstInvalidStep, input.steps);
    }
    return { status: 'blocked' as const };
  }

  const values = sanitizeSteppedFormValues(
    await input.api.getValues(),
    input.stepFieldName
  );
  const submitResult = await input.submitHandler?.(
    values,
    createSteppedSubmitContext(input.api, safeActiveStep)
  );
  if (submitResult === false) {
    return { status: 'blocked' as const };
  }
  input.api.setLatestSubmissionValues(values);
  input.onOpenChange?.(false);
  return {
    status: 'submitted' as const,
    values,
  };
}

export interface SubmitPageControllerBridgeInput {
  getActiveStep: () => number;
  getOpen: () => boolean;
  getStepFieldName: () => string;
  getSteps: () => ResolvedAdminFormStepSchema[];
  getSubmitHandler: () => AdminFormSteppedSubmitHandler | undefined;
  onOpenChange?: (open: boolean) => void;
  onSubmitted?: () => Promise<void> | void;
  onStepChange?: (payload: AdminFormStepChangePayload) => void;
  setOpen: (open: boolean) => void;
  setStep: (
    step: number,
    steps?: ResolvedAdminFormStepSchema[]
  ) => Promise<number>;
}

export function createSubmitPageControllerBridge(
  api: AdminFormApi,
  input: SubmitPageControllerBridgeInput
): {
  applyStepChange: (
    nextStep: number,
    steps: ResolvedAdminFormStepSchema[]
  ) => Promise<void>;
  controller: AdminFormSubmitPageController;
} {
  const applyStepChange = async (
    nextStep: number,
    steps: ResolvedAdminFormStepSchema[]
  ) => {
    const previousStep = input.getActiveStep();
    const safeStep = await input.setStep(nextStep, steps);
    const payload = resolveStepChangePayload(steps, previousStep, safeStep);
    input.onStepChange?.(payload);
  };

  const setOpenAndNotify = (open: boolean) => {
    input.setOpen(open);
    input.onOpenChange?.(open);
  };

  const controller: AdminFormSubmitPageController = {
    close() {
      setOpenAndNotify(false);
    },
    getFormApi() {
      return api;
    },
    getOpen() {
      return input.getOpen();
    },
    getStep() {
      return input.getActiveStep();
    },
    getTotalSteps() {
      return input.getSteps().length;
    },
    async goToStep(step: number) {
      return await input.setStep(step, input.getSteps());
    },
    async next(): Promise<AdminFormSubmitPageNextResult> {
      const result = await submitPageNextStep({
        activeStep: input.getActiveStep(),
        api,
        applyStepChange,
        onOpenChange: setOpenAndNotify,
        stepFieldName: input.getStepFieldName(),
        steps: input.getSteps(),
        submitHandler: input.getSubmitHandler(),
      });
      if (result.status === 'submitted') {
        await input.onSubmitted?.();
      }
      return result;
    },
    open() {
      setOpenAndNotify(true);
    },
    async prev() {
      return await submitPagePrevStep({
        activeStep: input.getActiveStep(),
        applyStepChange,
        steps: input.getSteps(),
      });
    },
    setOpen(open: boolean) {
      setOpenAndNotify(open);
    },
    toggle(open?: boolean) {
      setOpenAndNotify(typeof open === 'boolean' ? open : !input.getOpen());
    },
  };

  return {
    applyStepChange,
    controller,
  };
}
