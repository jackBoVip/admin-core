
import {
  buildSteppedFormSchema,
  clampStepIndex,
  createSubmitPagePanelStyle,
  resolveSubmitPageCloseResetPlan,
  resolveSubmitPageDisplaySections,
  resolveSubmitPageFooterState,
  resolveSubmitPagePanelClassName,
  resolveSubmitPagePrimaryActionLabel,
  resolveSubmitPageStepHeaderItems,
  resolveSubmitPageStepPanelClassName,
  resolveSubmitPageViewState,
  shouldShowSubmitPageStepHeader,
  createFormApi,
  createFormPropsSyncTracker,
  getLocaleMessages,
  resolveSubmitPageFormProps,
  resolveSubmitPageSubmitHandler,
  resolveStepChangePayload,
  retainSubmitPageBodyClass,
  shouldRenderSteppedForm,
  submitPageNextStep,
  submitPagePrevStep,
  syncSubmitPageStep,
  type AdminFormApi,
  type BuildSteppedFormSchemaResult,
  type ResolvedAdminFormStepSchema,
} from '@admin-core/form-core';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AdminForm } from './AdminForm';
import type { AdminFormSubmitPageReactProps } from '../types';
import type { CSSProperties } from 'react';

type AdminFormSubmitPageInternalProps = AdminFormSubmitPageReactProps & {
  steppedResult?: BuildSteppedFormSchemaResult;
};

function useStableFormApi(
  inputFormApi: AdminFormApi | undefined,
  initialFormProps: Record<string, any>
) {
  const createdApiRef = useRef<AdminFormApi | null>(null);

  if (!inputFormApi && !createdApiRef.current) {
    createdApiRef.current = createFormApi(initialFormProps);
  }

  return inputFormApi ?? (createdApiRef.current as AdminFormApi);
}

export function AdminFormSubmitPage(props: AdminFormSubmitPageInternalProps) {
  const localeMessages = getLocaleMessages().submitPage;
  const {
    animation = 'slide',
    cancelText,
    description,
    destroyOnClose = true,
    drawerPlacement = 'right',
    formApi,
    initialStep = 0,
    maskClosable = true,
    mode = 'modal',
    nextText,
    onCancel,
    onOpenChange,
    onStepChange,
    open,
    prevText,
    resetOnClose = true,
    resetOnSubmit = true,
    rowColumns = 1,
    showStepHeader = true,
    stepDurationMs = 260,
    stepFieldName,
    steps,
    submitText,
    title,
  } = props;

  const stepped = useMemo(
    () =>
      props.steppedResult ??
      buildSteppedFormSchema(steps, {
        includeSectionDivider: false,
        rowColumns,
        stepFieldName,
      }),
    [props.steppedResult, rowColumns, stepFieldName, steps]
  );
  const totalSteps = stepped.steps.length;
  const resolvedInitialStep = clampStepIndex(initialStep, totalSteps || 1);
  const [activeStep, setActiveStep] = useState(resolvedInitialStep);
  const [stepDirection, setStepDirection] = useState<'backward' | 'fade' | 'forward'>('fade');
  const [stepRenderKey, setStepRenderKey] = useState(0);
  const formProps = useMemo(
    () => resolveSubmitPageFormProps(props, stepped.schema),
    [props, stepped.schema]
  );
  const api = useStableFormApi(formApi, formProps);
  const propsSyncTrackerRef = useRef(createFormPropsSyncTracker());
  const previousOpenRef = useRef(open);
  const skipAutoResetOnCloseRef = useRef(false);
  const submitHandler = resolveSubmitPageSubmitHandler(props);

  useEffect(() => {
    api.mount();
    return () => {
      if (!formApi) {
        api.unmount();
      }
    };
  }, [api, formApi]);

  useEffect(() => {
    if (!propsSyncTrackerRef.current.hasChanges(formProps)) {
      return;
    }
    api.setState(formProps);
  }, [api, formProps]);

  useEffect(() => {
    const safeStep = clampStepIndex(initialStep, totalSteps || 1);
    setActiveStep(safeStep);
    setStepRenderKey((value) => value + 1);
    setStepDirection('fade');
    void syncSubmitPageStep(api, stepped.stepFieldName, safeStep, true);
  }, [api, initialStep, stepped.stepFieldName, totalSteps]);

  useEffect(() => {
    const previousOpen = previousOpenRef.current;
    previousOpenRef.current = open;
    const resetPlan = resolveSubmitPageCloseResetPlan({
      open,
      previousOpen,
      resetOnClose,
      skipAutoResetOnClose: skipAutoResetOnCloseRef.current,
    });
    skipAutoResetOnCloseRef.current = resetPlan.nextSkipAutoResetOnClose;
    if (resetPlan.shouldReset) {
      void api.resetForm();
    }
  }, [api, open, resetOnClose]);

  const applyStepChange = useCallback(
    async (nextStep: number, currentSteps: ResolvedAdminFormStepSchema[]) => {
      const safeNextStep = clampStepIndex(nextStep, currentSteps.length || 1);
      if (safeNextStep === activeStep) {
        return;
      }
      const payload = resolveStepChangePayload(currentSteps, activeStep, safeNextStep);
      await syncSubmitPageStep(api, stepped.stepFieldName, safeNextStep, true);
      setStepDirection(payload.direction === 'none' ? 'fade' : payload.direction);
      setStepRenderKey((value) => value + 1);
      setActiveStep(safeNextStep);
      onStepChange?.(payload);
    },
    [activeStep, api, onStepChange, stepped.stepFieldName]
  );

  const handleClose = useCallback(() => {
    onCancel?.();
    onOpenChange?.(false);
    if (!resetOnClose) {
      return;
    }
    skipAutoResetOnCloseRef.current = true;
    void api.resetForm();
  }, [api, onCancel, onOpenChange, resetOnClose]);

  const viewState = useMemo(
    () =>
      resolveSubmitPageViewState({
        activeStep,
        rowColumns,
        steps: stepped.steps,
      }),
    [activeStep, rowColumns, stepped.steps]
  );
  const currentStep = viewState.currentStep;
  const currentColumns = viewState.currentColumns;
  const currentSections = useMemo(
    () => resolveSubmitPageDisplaySections(currentStep),
    [currentStep]
  );
  const stepHeaderItems = useMemo(
    () =>
      resolveSubmitPageStepHeaderItems({
        activeStep: viewState.activeStep,
        steps: stepped.steps,
      }),
    [stepped.steps, viewState.activeStep]
  );
  const footerState = useMemo(
    () =>
      resolveSubmitPageFooterState({
        activeStep: viewState.activeStep,
        totalSteps: viewState.totalSteps,
      }),
    [viewState.activeStep, viewState.totalSteps]
  );

  const handleNext = useCallback(async () => {
    const result = await submitPageNextStep({
      activeStep,
      api,
      applyStepChange,
      onOpenChange,
      stepFieldName: stepped.stepFieldName,
      steps: stepped.steps,
      submitHandler,
    });
    if (result.status === 'submitted' && resetOnSubmit) {
      skipAutoResetOnCloseRef.current = true;
      await api.resetForm();
      const resetStep = clampStepIndex(initialStep, totalSteps || 1);
      await applyStepChange(resetStep, stepped.steps);
    }
  }, [
    activeStep,
    api,
    applyStepChange,
    initialStep,
    onOpenChange,
    totalSteps,
    stepped.stepFieldName,
    stepped.steps,
    submitHandler,
    resetOnSubmit,
  ]);

  const handlePrev = useCallback(async () => {
    await submitPagePrevStep({
      activeStep,
      applyStepChange,
      steps: stepped.steps,
    });
  }, [activeStep, applyStepChange, stepped.steps]);

  const visible = shouldRenderSteppedForm(open, destroyOnClose);

  useEffect(() => {
    if (!(open && visible)) {
      return;
    }
    return retainSubmitPageBodyClass();
  }, [open, visible]);

  if (!visible || viewState.totalSteps === 0) {
    return null;
  }

  const panelClassName = resolveSubmitPagePanelClassName({
    drawerPlacement,
    mode,
    open,
  });
  const panelStyle = {
    ...createSubmitPagePanelStyle(mode, props.width),
    '--admin-form-step-duration': `${stepDurationMs}ms`,
  } as CSSProperties & Record<'--admin-form-step-duration', string>;

  return (
    <div className={panelClassName}>
      <div
        className="admin-form-page__mask"
        onClick={() => {
          if (maskClosable) {
            handleClose();
          }
        }}
      />

      <div
        className="admin-form-page__panel"
        style={panelStyle}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <div className="admin-form-page__header">
          <div className="admin-form-page__title-wrap">
            <h3 className="admin-form-page__title">{title || currentStep?.title}</h3>
            {description || currentStep?.description ? (
              <div className="admin-form-page__description">
                {description || currentStep?.description}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="admin-form-page__close"
            aria-label={localeMessages.close}
            onClick={handleClose}
          >
            ×
          </button>
        </div>

        {shouldShowSubmitPageStepHeader(showStepHeader, viewState.totalSteps) ? (
          <div className="admin-form-page__steps">
            {stepHeaderItems.map((stepItem) => {
              return (
                <button
                  key={stepItem.key}
                  type="button"
                  className={stepItem.className}
                  onClick={() => {
                    void applyStepChange(stepItem.index, stepped.steps);
                  }}
                >
                  <span className="admin-form-page__step-dot">
                    {stepItem.dotLabel}
                  </span>
                  <span>{stepItem.title}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="admin-form-page__body">
          <div
            key={`${activeStep}-${stepRenderKey}`}
            className={resolveSubmitPageStepPanelClassName({
              animation,
              direction: stepDirection,
            })}
          >
            {currentSections.map((section) => (
                <div key={section.key} className="admin-form-page__section">
                  <div className="admin-form__section">
                    {section.title ? (
                      <h4 className="admin-form__section-title">{section.title}</h4>
                    ) : null}
                    {section.description ? (
                      <div className="admin-form__section-description">{section.description}</div>
                    ) : null}
                  </div>
                </div>
              ))}
            <AdminForm
              formApi={api}
              gridColumns={currentColumns}
              showDefaultActions={false}
              visibleFieldNames={currentStep?.fieldNames ?? []}
            />
          </div>
        </div>

        <div className="admin-form-page__footer">
          <button type="button" className="admin-form__button" onClick={handleClose}>
            {cancelText ?? localeMessages.cancel}
          </button>
          <button
            type="button"
            className="admin-form__button"
            disabled={footerState.previousDisabled}
            onClick={() => {
              void handlePrev();
            }}
          >
            {prevText ?? localeMessages.previous}
          </button>
          <button
            type="button"
            className="admin-form__button admin-form__button--primary"
            onClick={() => {
              void handleNext();
            }}
          >
            {resolveSubmitPagePrimaryActionLabel({
              activeStep: footerState.safeActiveStep,
              nextText: nextText ?? localeMessages.next,
              submitText: submitText ?? localeMessages.submit,
              totalSteps: footerState.totalSteps,
            })}
          </button>
        </div>
      </div>
    </div>
  );
}
