import { describe, expect, it } from 'vitest';
import { createFormApi } from '../form-api';
import {
  buildSteppedFormSchema,
  createSubmitPageControllerBridge,
  resolveSubmitPageCloseResetPlan,
  resolveSubmitPageDisplaySections,
  resolveSubmitPageFormProps,
  resolveSubmitPageFooterState,
  resolveSubmitPagePanelClassName,
  resolveSubmitPagePrimaryActionLabel,
  resolveSubmitPageStepHeaderItems,
  resolveSubmitPageStepItemState,
  resolveSubmitPageStepPanelClassName,
  resolveSubmitPageViewState,
  shouldShowSubmitPageStepHeader,
  resolveSubmitPageSubmitHandler,
  submitPageNextStep,
} from '../utils';

describe('submit-page-shared helpers', () => {
  it('should resolve submit handler with onSubmit first', () => {
    const onSubmit = () => undefined;
    const handleSubmit = () => undefined;
    expect(resolveSubmitPageSubmitHandler({ onSubmit, handleSubmit })).toBe(onSubmit);
    expect(resolveSubmitPageSubmitHandler({ handleSubmit })).toBe(handleSubmit);
  });

  it('should move to next step after current step validation passes', async () => {
    const built = buildSteppedFormSchema([
      {
        title: 's1',
        schema: [
          {
            component: 'input',
            fieldName: 'a',
            label: 'A',
            rules: 'required',
          },
        ],
      },
      {
        title: 's2',
        schema: [
          {
            component: 'input',
            fieldName: 'b',
            label: 'B',
            rules: 'required',
          },
        ],
      },
    ]);

    const api = createFormApi({
      schema: built.schema,
      showDefaultActions: false,
    });
    api.mount();
    await api.setValues(
      {
        a: 'ok',
      },
      true
    );
    let movedTo = -1;
    const result = await submitPageNextStep({
      activeStep: 0,
      api,
      applyStepChange: async (next) => {
        movedTo = next;
        await api.setFieldValue(built.stepFieldName, next, false);
      },
      stepFieldName: built.stepFieldName,
      steps: built.steps,
    });

    expect(result.status).toBe('moved');
    expect(movedTo).toBe(1);
    api.unmount();
  });

  it('should submit final step and return sanitized values', async () => {
    const built = buildSteppedFormSchema([
      {
        title: 's1',
        schema: [
          {
            component: 'input',
            fieldName: 'a',
            label: 'A',
            rules: 'required',
          },
        ],
      },
    ]);

    const api = createFormApi({
      schema: built.schema,
      showDefaultActions: false,
    });
    api.mount();
    await api.setValues({ a: 'done' }, true);

    let submittedValues: Record<string, any> | null = null;
    const result = await submitPageNextStep({
      activeStep: 0,
      api,
      applyStepChange: async () => undefined,
      stepFieldName: built.stepFieldName,
      steps: built.steps,
      submitHandler: async (values) => {
        submittedValues = values;
      },
    });

    expect(result.status).toBe('submitted');
    expect(result.values).toEqual({ a: 'done' });
    expect(submittedValues).toEqual({ a: 'done' });
    api.unmount();
  });

  it('should stay on current page when submit handler returns false', async () => {
    const built = buildSteppedFormSchema([
      {
        title: 's1',
        schema: [
          {
            component: 'input',
            fieldName: 'a',
            label: 'A',
            rules: 'required',
          },
        ],
      },
    ]);

    const api = createFormApi({
      schema: built.schema,
      showDefaultActions: false,
    });
    api.mount();
    await api.setValues({ a: 'done' }, true);
    let open = true;
    const result = await submitPageNextStep({
      activeStep: 0,
      api,
      applyStepChange: async () => undefined,
      onOpenChange(nextOpen) {
        open = nextOpen;
      },
      stepFieldName: built.stepFieldName,
      steps: built.steps,
      submitHandler: async () => false,
    });

    expect(result.status).toBe('blocked');
    expect(open).toBe(true);
    api.unmount();
  });

  it('should strip submit-page only props when resolving form props', () => {
    const resolved = resolveSubmitPageFormProps(
      {
        open: true,
        resetOnClose: false,
        resetOnSubmit: false,
        rowColumns: 2,
        schema: [],
        showDefaultActions: true,
        steps: [],
      } as any,
      []
    );
    expect((resolved as any).resetOnClose).toBeUndefined();
    expect((resolved as any).resetOnSubmit).toBeUndefined();
    expect(resolved.gridColumns).toBe(2);
  });

  it('should create unified submit-page controller bridge', async () => {
    const built = buildSteppedFormSchema([
      {
        title: 's1',
        schema: [
          {
            component: 'input',
            fieldName: 'a',
            label: 'A',
            rules: 'required',
          },
        ],
      },
      {
        title: 's2',
        schema: [
          {
            component: 'input',
            fieldName: 'b',
            label: 'B',
            rules: 'required',
          },
        ],
      },
    ]);
    const api = createFormApi({
      schema: built.schema,
      showDefaultActions: false,
    });
    api.mount();

    let activeStep = 0;
    let open = true;
    let changed = 0;

    const { controller } = createSubmitPageControllerBridge(api, {
      getActiveStep: () => activeStep,
      getOpen: () => open,
      getStepFieldName: () => built.stepFieldName,
      getSteps: () => built.steps,
      getSubmitHandler: () => undefined,
      onStepChange: () => {
        changed += 1;
      },
      setOpen(value) {
        open = value;
      },
      async setStep(step) {
        activeStep = step;
        await api.setFieldValue(built.stepFieldName, step, false);
        return step;
      },
    });

    await api.setValues({ a: 'ok' }, true);
    const nextResult = await controller.next();
    expect(nextResult.status).toBe('moved');
    expect(activeStep).toBe(1);
    expect(changed).toBe(1);
    controller.toggle();
    expect(open).toBe(false);
    api.unmount();
  });

  it('should notify onOpenChange for controller open state actions', async () => {
    const built = buildSteppedFormSchema([
      {
        title: 's1',
        schema: [{ component: 'input', fieldName: 'name' }],
      },
    ]);
    const api = createFormApi({
      schema: built.schema,
      showDefaultActions: false,
    });
    api.mount();
    let open = false;
    const openEvents: boolean[] = [];
    const { controller } = createSubmitPageControllerBridge(api, {
      getActiveStep: () => 0,
      getOpen: () => open,
      getStepFieldName: () => built.stepFieldName,
      getSteps: () => built.steps,
      getSubmitHandler: () => undefined,
      onOpenChange(nextOpen) {
        openEvents.push(nextOpen);
      },
      setOpen(nextOpen) {
        open = nextOpen;
      },
      async setStep(step) {
        return step;
      },
    });

    controller.open();
    controller.toggle();
    controller.setOpen(true);
    controller.close();

    expect(openEvents).toEqual([true, false, true, false]);
    api.unmount();
  });

  it('should call onSubmitted hook in submit-page controller bridge', async () => {
    const built = buildSteppedFormSchema([
      {
        title: 's1',
        schema: [{ component: 'input', fieldName: 'a', label: 'A', rules: 'required' }],
      },
    ]);
    const api = createFormApi({
      schema: built.schema,
      showDefaultActions: false,
    });
    api.mount();
    await api.setValues({ a: 'ok' }, true);
    let submittedHookCalled = 0;
    const { controller } = createSubmitPageControllerBridge(api, {
      getActiveStep: () => 0,
      getOpen: () => true,
      getStepFieldName: () => built.stepFieldName,
      getSteps: () => built.steps,
      getSubmitHandler: () => async () => undefined,
      onSubmitted: () => {
        submittedHookCalled += 1;
      },
      setOpen() {},
      async setStep(step) {
        return step;
      },
    });

    const result = await controller.next();
    expect(result.status).toBe('submitted');
    expect(submittedHookCalled).toBe(1);
    api.unmount();
  });

  it('should resolve submit-page class names and close reset plan', () => {
    expect(
      resolveSubmitPagePanelClassName({
        mode: 'drawer',
        drawerPlacement: 'left',
        open: true,
      })
    ).toContain('admin-form-page--drawer-left');
    expect(
      resolveSubmitPageStepPanelClassName({
        animation: 'slide',
        direction: 'backward',
      })
    ).toContain('admin-form-page__step-panel--backward');
    expect(
      resolveSubmitPageStepPanelClassName({
        animation: 'fade',
        direction: 'forward',
      })
    ).toContain('admin-form-page__step-panel--fade');

    const resetPlan = resolveSubmitPageCloseResetPlan({
      open: false,
      previousOpen: true,
      resetOnClose: true,
      skipAutoResetOnClose: false,
    });
    expect(resetPlan.shouldReset).toBe(true);

    const skipPlan = resolveSubmitPageCloseResetPlan({
      open: false,
      previousOpen: true,
      resetOnClose: true,
      skipAutoResetOnClose: true,
    });
    expect(skipPlan.shouldReset).toBe(false);
    expect(skipPlan.nextSkipAutoResetOnClose).toBe(false);
  });

  it('should resolve submit-page view state and action label', () => {
    const built = buildSteppedFormSchema([
      { title: 's1', schema: [{ component: 'input', fieldName: 'a', label: 'A' }] },
      { title: 's2', schema: [{ component: 'input', fieldName: 'b', label: 'B' }] },
    ]);
    const viewState = resolveSubmitPageViewState({
      activeStep: 0,
      rowColumns: 2,
      steps: built.steps,
    });
    expect(viewState.totalSteps).toBe(2);
    expect(viewState.isFirstStep).toBe(true);
    expect(viewState.isLastStep).toBe(false);
    expect(viewState.currentStep?.title).toBe('s1');

    const firstStep = built.steps[0];
    expect(firstStep).toBeDefined();
    if (!firstStep) {
      throw new Error('expected first submit-page step to exist');
    }

    const stepState = resolveSubmitPageStepItemState({
      activeStep: 1,
      index: 0,
      step: firstStep,
    });
    expect(stepState.done).toBe(true);
    expect(stepState.dotLabel).toBe('✓');

    expect(
      resolveSubmitPagePrimaryActionLabel({
        activeStep: 0,
        totalSteps: 2,
        nextText: '下一步',
        submitText: '提交',
      })
    ).toBe('下一步');
    expect(
      resolveSubmitPagePrimaryActionLabel({
        activeStep: 1,
        totalSteps: 2,
        nextText: '下一步',
        submitText: '提交',
      })
    ).toBe('提交');

    const stepHeaders = resolveSubmitPageStepHeaderItems({
      activeStep: 0,
      steps: built.steps,
    });
    expect(stepHeaders).toHaveLength(2);
    expect(stepHeaders[0]?.status).toBe('active');

    const footerState = resolveSubmitPageFooterState({
      activeStep: 0,
      totalSteps: 2,
    });
    expect(footerState.previousDisabled).toBe(true);
    expect(footerState.isLastStep).toBe(false);

    expect(shouldShowSubmitPageStepHeader(undefined, 2)).toBe(true);
    expect(shouldShowSubmitPageStepHeader(false, 2)).toBe(false);
    expect(resolveSubmitPageDisplaySections(built.steps[0])).toHaveLength(1);
  });
});
