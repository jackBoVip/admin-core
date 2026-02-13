import type { AdminFormApi } from '@admin-core/form-core';

import {
  buildSteppedFormSchema,
  clampStepIndex,
  createSubmitPageControllerBridge,
  createFormApi,
  mergeFormProps,
  pickSubmitPageProps,
  resolveSubmitPageFormProps,
  resolveSubmitPageSubmitHandler,
  syncSubmitPageStep,
  type AdminFormStepChangePayload,
  type ResolvedAdminFormStepSchema,
} from '@admin-core/form-core';
import { defineComponent, h, onBeforeUnmount, ref } from 'vue';

import { AdminFormSubmitPage } from '../components/AdminFormSubmitPage';
import type {
  AdminFormSubmitPageVueProps,
  UseAdminFormSubmitPageComponentProps,
  UseAdminFormSubmitPageOptions,
  UseAdminFormSubmitPageReturn,
} from '../types';

export function useAdminFormSubmitPage(
  options: UseAdminFormSubmitPageOptions
): UseAdminFormSubmitPageReturn {
  const bootStepped = buildSteppedFormSchema(options.steps ?? [], {
    includeSectionDivider: false,
    rowColumns: options.rowColumns ?? 1,
    stepFieldName: options.stepFieldName,
  });
  const api = createFormApi(
    resolveSubmitPageFormProps(options as any, bootStepped.schema)
  );
  const openSnapshot = ref(!!options.open);
  const stepSnapshot = ref(
    clampStepIndex(options.initialStep ?? 0, bootStepped.steps.length || 1)
  );
  const stepConfig = ref<{
    stepFieldName: string;
    steps: ResolvedAdminFormStepSchema[];
  }>({
    stepFieldName: bootStepped.stepFieldName,
    steps: bootStepped.steps,
  });
  const callbacks = ref<{
    onOpenChange?: (open: boolean) => void;
    onStepChange?: (payload: AdminFormStepChangePayload) => void;
  }>({});
  const submitHandler = ref(
    resolveSubmitPageSubmitHandler(options as any)
  );
  const controlledInitialStep = ref(stepSnapshot.value);

  function setOpen(open: boolean) {
    openSnapshot.value = open;
  }

  async function setStep(step: number, steps = stepConfig.value.steps) {
    const safeStep = clampStepIndex(step, steps.length || 1);
    stepSnapshot.value = safeStep;
    controlledInitialStep.value = safeStep;
    await syncSubmitPageStep(api, stepConfig.value.stepFieldName, safeStep, true);
    return safeStep;
  }

  const { controller } = createSubmitPageControllerBridge(api, {
    getActiveStep: () => stepSnapshot.value,
    getOpen: () => openSnapshot.value,
    onSubmitted: async () => {
      const resetStep = clampStepIndex(
        options.initialStep ?? 0,
        stepConfig.value.steps.length || 1
      );
      await setStep(resetStep, stepConfig.value.steps);
    },
    getStepFieldName: () => stepConfig.value.stepFieldName,
    getSteps: () => stepConfig.value.steps,
    getSubmitHandler: () => submitHandler.value,
    onOpenChange: (open: boolean) => {
      callbacks.value.onOpenChange?.(open);
    },
    onStepChange: (payload: AdminFormStepChangePayload) => {
      callbacks.value.onStepChange?.(payload);
    },
    setOpen,
    setStep,
  });

  const FormSubmitPage = defineComponent(
    (props: UseAdminFormSubmitPageComponentProps, { attrs, expose }) => {
      onBeforeUnmount(() => {
        api.unmount();
      });

      expose({
        getFormApi: () => api,
      });

      return () => {
        const {
          onOpenChange: optionOnOpenChange,
          onStepChange: optionOnStepChange,
          initialStep: optionInitialStep,
          open: _optionOpen,
          ...optionRest
        } = options as Partial<AdminFormSubmitPageVueProps>;
        const {
          onOpenChange: attrOnOpenChange,
          onStepChange: attrOnStepChange,
          initialStep: attrInitialStep,
          open: attrOpen,
          ...attrRest
        } = attrs as Partial<AdminFormSubmitPageVueProps>;
        const {
          onOpenChange: propOnOpenChange,
          onStepChange: propOnStepChange,
          initialStep: propInitialStep,
          open: propOpen,
          ...propRest
        } = props as Partial<AdminFormSubmitPageVueProps>;

        const mergedProps = mergeFormProps(
          pickSubmitPageProps(optionRest as any),
          pickSubmitPageProps(attrRest as any),
          pickSubmitPageProps(propRest as any),
          {
            formApi: api,
          }
        ) as AdminFormSubmitPageVueProps;
        const mergedOnOpenChange = propOnOpenChange ?? attrOnOpenChange ?? optionOnOpenChange;
        const mergedOnStepChange = propOnStepChange ?? attrOnStepChange ?? optionOnStepChange;
        const stepped = buildSteppedFormSchema(mergedProps.steps ?? [], {
          includeSectionDivider: false,
          rowColumns: mergedProps.rowColumns ?? 1,
          stepFieldName: mergedProps.stepFieldName,
        });
        stepConfig.value = {
          stepFieldName: stepped.stepFieldName,
          steps: stepped.steps,
        };
        submitHandler.value = resolveSubmitPageSubmitHandler(mergedProps as any);
        callbacks.value.onOpenChange = mergedOnOpenChange;
        callbacks.value.onStepChange = mergedOnStepChange;
        const resolvedOpen = typeof propOpen === 'boolean'
          ? propOpen
          : typeof attrOpen === 'boolean'
            ? attrOpen
            : openSnapshot.value;
        openSnapshot.value = resolvedOpen;
        const resolvedInitialStep = typeof propInitialStep === 'number'
          ? propInitialStep
          : typeof attrInitialStep === 'number'
            ? attrInitialStep
            : typeof controlledInitialStep.value === 'number'
              ? controlledInitialStep.value
              : optionInitialStep;

        return h(
          AdminFormSubmitPage as any,
          {
            ...(mergedProps as any),
            initialStep: resolvedInitialStep,
            onOpenChange: (open: boolean) => {
              setOpen(open);
              mergedOnOpenChange?.(open);
            },
            onStepChange: (payload: AdminFormStepChangePayload) => {
              stepSnapshot.value = payload.nextStep;
              mergedOnStepChange?.(payload);
            },
            open: resolvedOpen,
            steppedResult: stepped,
          } as any
        );
      };
    },
    {
      name: 'AdminUseFormSubmitPage',
      inheritAttrs: false,
    }
  );

  return [FormSubmitPage, api as AdminFormApi, controller] as const;
}
