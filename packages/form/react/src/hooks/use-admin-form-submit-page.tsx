

import type { AdminFormApi 
 
 
 
} from '@admin-core/form-core';
import {
  buildSteppedFormSchema,
  clampStepIndex,
  createSubmitPageControllerBridge,
  createFormApi,
  mergeFormProps,
  resolveSubmitPageFormProps,
  resolveSubmitPageSubmitHandler,
  syncSubmitPageStep,
  type AdminFormSteppedSubmitHandler,
  type AdminFormStepChangePayload,
  type ResolvedAdminFormStepSchema 
 
 
 
} from '@admin-core/form-core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminFormSubmitPage } from '../components/AdminFormSubmitPage';
import type {
  AdminFormSubmitPageReactProps,
  UseAdminFormSubmitPageComponentProps,
  UseAdminFormSubmitPageOptions,
  UseAdminFormSubmitPageReturn,
} from '../types';
import type { ComponentType } from 'react';

export function useAdminFormSubmitPage(
  options: UseAdminFormSubmitPageOptions
): UseAdminFormSubmitPageReturn {
  const openSnapshotRef = useRef<boolean>(!!options.open);
  const [internalOpen, setInternalOpen] = useState<boolean>(openSnapshotRef.current);
  const bootStepped = useMemo(
    () =>
      buildSteppedFormSchema(options.steps ?? [], {
        includeSectionDivider: false,
        rowColumns: options.rowColumns ?? 1,
        stepFieldName: options.stepFieldName,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const apiRef = useRef<AdminFormApi | null>(null);
  if (!apiRef.current) {
    apiRef.current = createFormApi(
      resolveSubmitPageFormProps(options as any, bootStepped.schema)
    );
  }
  const api = apiRef.current;
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const stepSnapshotRef = useRef<number>(
    clampStepIndex(options.initialStep ?? 0, bootStepped.steps.length || 1)
  );
  const stepConfigRef = useRef<{
    stepFieldName: string;
    steps: ResolvedAdminFormStepSchema[];
  }>({
    stepFieldName: bootStepped.stepFieldName,
    steps: bootStepped.steps,
  });
  const callbackRef = useRef<{
    onOpenChange?: (open: boolean) => void;
    onStepChange?: (payload: AdminFormStepChangePayload) => void;
  }>({});
  const submitHandlerRef = useRef<AdminFormSteppedSubmitHandler | undefined>(
    resolveSubmitPageSubmitHandler(options as any)
  );
  const [controlledInitialStep, setControlledInitialStep] = useState(
    stepSnapshotRef.current
  );
  const controlledInitialStepRef = useRef(stepSnapshotRef.current);
  const internalOpenRef = useRef(internalOpen);

  const setOpen = useCallback((open: boolean) => {
    openSnapshotRef.current = open;
    internalOpenRef.current = open;
    setInternalOpen((previous) => (previous === open ? previous : open));
  }, []);

  const setStep = useCallback(
    async (step: number, steps = stepConfigRef.current.steps) => {
      const safeStep = clampStepIndex(step, steps.length || 1);
      stepSnapshotRef.current = safeStep;
      controlledInitialStepRef.current = safeStep;
      setControlledInitialStep((previous) =>
        previous === safeStep ? previous : safeStep
      );
      await syncSubmitPageStep(api, stepConfigRef.current.stepFieldName, safeStep, true);
      return safeStep;
    },
    [api]
  );

  useEffect(() => {
    if (typeof options.open === 'boolean') {
      setOpen(options.open);
    }
  }, [options.open, setOpen]);

  useEffect(() => {
    internalOpenRef.current = internalOpen;
  }, [internalOpen]);

  useEffect(() => {
    if (typeof options.initialStep !== 'number') {
      return;
    }
    const safeStep = clampStepIndex(
      options.initialStep,
      stepConfigRef.current.steps.length || 1
    );
    stepSnapshotRef.current = safeStep;
    controlledInitialStepRef.current = safeStep;
    setControlledInitialStep((previous) =>
      previous === safeStep ? previous : safeStep
    );
  }, [options.initialStep]);

  useEffect(() => {
    controlledInitialStepRef.current = controlledInitialStep;
  }, [controlledInitialStep]);

  useEffect(() => {
    return () => {
      api.unmount();
    };
  }, [api]);

  const controller = useMemo(
    () =>
      createSubmitPageControllerBridge(api, {
        getActiveStep: () => stepSnapshotRef.current,
        getOpen: () => openSnapshotRef.current,
        onSubmitted: async () => {
          const resetStep = clampStepIndex(
            optionsRef.current.initialStep ?? 0,
            stepConfigRef.current.steps.length || 1
          );
          await setStep(resetStep, stepConfigRef.current.steps);
        },
        getStepFieldName: () => stepConfigRef.current.stepFieldName,
        getSteps: () => stepConfigRef.current.steps,
        getSubmitHandler: () => submitHandlerRef.current,
        onOpenChange: (open: boolean) => {
          callbackRef.current.onOpenChange?.(open);
        },
        onStepChange: (payload) => {
          callbackRef.current.onStepChange?.(payload);
        },
        setOpen,
        setStep,
      }).controller,
    [api, setOpen, setStep]
  );

  const formSubmitPageRef = useRef<ComponentType<UseAdminFormSubmitPageComponentProps> | null>(
    null
  );
  if (!formSubmitPageRef.current) {
    formSubmitPageRef.current = function UseAdminFormSubmitPageComponent(props) {
        const {
          onOpenChange: optionOnOpenChange,
          onStepChange: optionOnStepChange,
          initialStep: optionInitialStep,
          open: _optionOpen,
          ...optionRest
        } = optionsRef.current as Partial<AdminFormSubmitPageReactProps>;
        const {
          onOpenChange: propOnOpenChange,
          onStepChange: propOnStepChange,
          initialStep: propInitialStep,
          open: propOpen,
          ...propRest
        } = props as UseAdminFormSubmitPageComponentProps;
        const mergedProps = mergeFormProps(
          optionRest as any,
          propRest as any,
          {
            formApi: api,
          }
        ) as AdminFormSubmitPageReactProps;
        const mergedOnOpenChange = propOnOpenChange ?? optionOnOpenChange;
        const mergedOnStepChange = propOnStepChange ?? optionOnStepChange;
        const stepped = useMemo(
          () =>
            buildSteppedFormSchema(mergedProps.steps ?? [], {
              includeSectionDivider: false,
              rowColumns: mergedProps.rowColumns ?? 1,
              stepFieldName: mergedProps.stepFieldName,
            }),
          [
            mergedProps.rowColumns,
            mergedProps.stepFieldName,
            mergedProps.steps,
          ]
        );
        stepConfigRef.current = {
          stepFieldName: stepped.stepFieldName,
          steps: stepped.steps,
        };
        submitHandlerRef.current = resolveSubmitPageSubmitHandler(mergedProps as any);
        callbackRef.current.onOpenChange = mergedOnOpenChange;
        callbackRef.current.onStepChange = mergedOnStepChange;
        const resolvedOpen = typeof propOpen === 'boolean' ? propOpen : internalOpenRef.current;
        openSnapshotRef.current = resolvedOpen;
        const resolvedInitialStep = typeof propInitialStep === 'number'
          ? propInitialStep
          : typeof controlledInitialStepRef.current === 'number'
            ? controlledInitialStepRef.current
            : optionInitialStep;
        return (
          <AdminFormSubmitPage
            {...mergedProps}
            initialStep={resolvedInitialStep}
            onOpenChange={(open) => {
              setOpen(open);
              mergedOnOpenChange?.(open);
            }}
            onStepChange={(payload) => {
              stepSnapshotRef.current = payload.nextStep;
              mergedOnStepChange?.(payload);
            }}
            open={resolvedOpen}
            steppedResult={stepped}
          />
        );
      };
  }
  const FormSubmitPage = formSubmitPageRef.current as ComponentType<UseAdminFormSubmitPageComponentProps>;

  return [FormSubmitPage, api, controller] as const;
}
