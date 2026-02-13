import type { DefineComponent, PropType, VNode } from 'vue';

import type {
  AdminFormApi,
  BuildSteppedFormSchemaResult,
  ResolvedAdminFormStepSchema,
} from '@admin-core/form-core';

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
  mergeFormProps,
  pickSubmitPageProps,
  resolveSubmitPageFormProps,
  resolveSubmitPageSubmitHandler,
  resolveStepChangePayload,
  retainSubmitPageBodyClass,
  shouldRenderSteppedForm,
  submitPageNextStep,
  submitPagePrevStep,
  syncSubmitPageStep,
} from '@admin-core/form-core';
import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';

import type { AdminFormSubmitPageVueProps } from '../types';
import { normalizeVueAttrs } from '../utils/attrs';

import { AdminForm } from './AdminForm';

export const AdminFormSubmitPage = defineComponent({
  name: 'AdminFormSubmitPage',
  inheritAttrs: false,
  props: {
    formApi: {
      default: undefined,
      type: Object as PropType<AdminFormApi | undefined>,
    },
    open: {
      default: false,
      type: Boolean,
    },
    steps: {
      default: () => [],
      type: Array as PropType<AdminFormSubmitPageVueProps['steps']>,
    },
    steppedResult: {
      default: undefined,
      type: Object as PropType<BuildSteppedFormSchemaResult | undefined>,
    },
  },
  setup(rawProps, { attrs, expose }) {
    const localeMessages = computed(() => getLocaleMessages().submitPage);
    const allProps = computed(
      () =>
        pickSubmitPageProps(
          mergeFormProps(normalizeVueAttrs(attrs as any), rawProps as any)
        ) as AdminFormSubmitPageVueProps
    );
    const stepped = computed(
      () =>
        rawProps.steppedResult ??
        buildSteppedFormSchema(allProps.value.steps ?? [], {
          includeSectionDivider: false,
          rowColumns: allProps.value.rowColumns ?? 1,
          stepFieldName: allProps.value.stepFieldName,
        })
    );
    const formProps = computed(() =>
      resolveSubmitPageFormProps(allProps.value, stepped.value.schema)
    );
    const api = rawProps.formApi ?? createFormApi(formProps.value);
    const propsSyncTracker = createFormPropsSyncTracker();
    const activeStep = ref(clampStepIndex(allProps.value.initialStep ?? 0, stepped.value.steps.length || 1));
    const stepDirection = ref<'backward' | 'fade' | 'forward'>('fade');
    const stepRenderKey = ref(0);
    let releaseBodyClass: null | (() => void) = null;
    let skipAutoResetOnClose = false;

    const submitHandler = computed(() => resolveSubmitPageSubmitHandler(allProps.value));

    async function applyStepChange(nextStep: number, currentSteps: ResolvedAdminFormStepSchema[]) {
      const safeNextStep = clampStepIndex(nextStep, currentSteps.length || 1);
      if (safeNextStep === activeStep.value) {
        return;
      }
      const payload = resolveStepChangePayload(currentSteps, activeStep.value, safeNextStep);
      await syncSubmitPageStep(api, stepped.value.stepFieldName, safeNextStep, true);
      stepDirection.value = payload.direction === 'none' ? 'fade' : payload.direction;
      stepRenderKey.value += 1;
      activeStep.value = safeNextStep;
      allProps.value.onStepChange?.(payload);
    }

    async function handleClose() {
      allProps.value.onCancel?.();
      allProps.value.onOpenChange?.(false);
      if (allProps.value.resetOnClose === false) {
        return;
      }
      skipAutoResetOnClose = true;
      await api.resetForm();
    }

    async function handlePrev() {
      await submitPagePrevStep({
        activeStep: activeStep.value,
        applyStepChange,
        steps: stepped.value.steps,
      });
    }

    async function handleNext() {
      const result = await submitPageNextStep({
        activeStep: activeStep.value,
        api,
        applyStepChange,
        onOpenChange: allProps.value.onOpenChange,
        stepFieldName: stepped.value.stepFieldName,
        steps: stepped.value.steps,
        submitHandler: submitHandler.value,
      });
      if (result.status === 'submitted' && allProps.value.resetOnSubmit !== false) {
        skipAutoResetOnClose = true;
        await api.resetForm();
        const resetStep = clampStepIndex(
          Number(allProps.value.initialStep ?? 0),
          stepped.value.steps.length || 1
        );
        await applyStepChange(resetStep, stepped.value.steps);
      }
    }

    watch(
      formProps,
      (nextFormProps) => {
        if (!propsSyncTracker.hasChanges(nextFormProps)) {
          return;
        }
        api.setState(nextFormProps);
      },
      { immediate: true }
    );

    watch(
      () => [allProps.value.initialStep, stepped.value.steps.length, stepped.value.stepFieldName],
      ([initial]) => {
        const safeStep = clampStepIndex(Number(initial ?? 0), stepped.value.steps.length || 1);
        activeStep.value = safeStep;
        stepDirection.value = 'fade';
        stepRenderKey.value += 1;
        void syncSubmitPageStep(api, stepped.value.stepFieldName, safeStep, true);
      },
      { immediate: true }
    );

    watch(
      () => allProps.value.open,
      (open, previousOpen) => {
        if (open) {
          if (!releaseBodyClass) {
            releaseBodyClass = retainSubmitPageBodyClass();
          }
        } else if (releaseBodyClass) {
          releaseBodyClass();
          releaseBodyClass = null;
        }
        const resetPlan = resolveSubmitPageCloseResetPlan({
          open,
          previousOpen: !!previousOpen,
          resetOnClose: allProps.value.resetOnClose !== false,
          skipAutoResetOnClose,
        });
        skipAutoResetOnClose = resetPlan.nextSkipAutoResetOnClose;
        if (resetPlan.shouldReset) {
          void api.resetForm();
        }
        if (!open) {
          return;
        }
        const safeStep = clampStepIndex(
          Number(allProps.value.initialStep ?? activeStep.value),
          stepped.value.steps.length || 1
        );
        activeStep.value = safeStep;
        stepRenderKey.value += 1;
        stepDirection.value = 'fade';
        void syncSubmitPageStep(api, stepped.value.stepFieldName, safeStep, true);
      },
      { immediate: true }
    );

    onMounted(() => {
      api.mount();
    });

    onBeforeUnmount(() => {
      if (releaseBodyClass) {
        releaseBodyClass();
        releaseBodyClass = null;
      }
      if (!rawProps.formApi) {
        api.unmount();
      }
    });

    expose({
      getFormApi: () => api,
    });

    return () => {
      const open = !!allProps.value.open;
      const mode = allProps.value.mode ?? 'modal';
      const drawerPlacement = allProps.value.drawerPlacement ?? 'right';
      const destroyOnClose = allProps.value.destroyOnClose ?? true;
      const visible = shouldRenderSteppedForm(open, destroyOnClose);
      const viewState = resolveSubmitPageViewState({
        activeStep: activeStep.value,
        rowColumns: allProps.value.rowColumns ?? 1,
        steps: stepped.value.steps,
      });
      const currentStep = viewState.currentStep;
      const totalSteps = viewState.totalSteps;
      const currentSections = resolveSubmitPageDisplaySections(currentStep);
      const stepHeaderItems = resolveSubmitPageStepHeaderItems({
        activeStep: viewState.activeStep,
        steps: stepped.value.steps,
      });
      const footerState = resolveSubmitPageFooterState({
        activeStep: viewState.activeStep,
        totalSteps,
      });

      if (!visible || totalSteps === 0 || !currentStep) {
        return null;
      }

      const panelClass = resolveSubmitPagePanelClassName({
        drawerPlacement,
        mode,
        open,
      });
      const animation = allProps.value.animation ?? 'slide';
      const panelStyle = {
        ...(createSubmitPagePanelStyle(mode, allProps.value.width) || {}),
        '--admin-form-step-duration': `${allProps.value.stepDurationMs ?? 260}ms`,
      };
      const currentColumns = viewState.currentColumns;

      const stepButtons: VNode[] = [];
      if (shouldShowSubmitPageStepHeader(allProps.value.showStepHeader, totalSteps)) {
        for (const stepItem of stepHeaderItems) {
          stepButtons.push(
            h(
              'button',
              {
                type: 'button',
                class: stepItem.className,
                onClick: () => {
                  void applyStepChange(stepItem.index, stepped.value.steps);
                },
              },
              [
                h('span', { class: 'admin-form-page__step-dot' }, `${stepItem.dotLabel}`),
                h('span', stepItem.title),
              ]
            )
          );
        }
      }

      return h('div', { class: panelClass }, [
        h('div', {
          class: 'admin-form-page__mask',
          onClick: () => {
            if (allProps.value.maskClosable ?? true) {
              void handleClose();
            }
          },
        }),
        h(
          'div',
          {
            class: 'admin-form-page__panel',
            style: panelStyle,
            onClick: (event: MouseEvent) => {
              event.stopPropagation();
            },
          },
          [
            h('div', { class: 'admin-form-page__header' }, [
              h('div', { class: 'admin-form-page__title-wrap' }, [
                h('h3', { class: 'admin-form-page__title' }, allProps.value.title || currentStep.title),
                allProps.value.description || currentStep.description
                  ? h(
                      'div',
                      { class: 'admin-form-page__description' },
                      allProps.value.description || currentStep.description
                    )
                  : null,
              ]),
              h(
                'button',
                {
                  'aria-label': localeMessages.value.close,
                  class: 'admin-form-page__close',
                  type: 'button',
                  onClick: () => {
                    void handleClose();
                  },
                },
                '×'
              ),
            ]),
            stepButtons.length > 0 ? h('div', { class: 'admin-form-page__steps' }, stepButtons) : null,
            h('div', { class: 'admin-form-page__body' }, [
              h(
                'div',
                {
                  key: `${activeStep.value}-${stepRenderKey.value}`,
                  class: resolveSubmitPageStepPanelClassName({
                    animation,
                    direction: stepDirection.value,
                  }),
                },
                [
                  ...(currentSections.map((section) =>
                      h('div', { key: section.key, class: 'admin-form-page__section' }, [
                        h('div', { class: 'admin-form__section' }, [
                          section.title
                            ? h('h4', { class: 'admin-form__section-title' }, section.title)
                            : null,
                          section.description
                            ? h(
                                'div',
                                { class: 'admin-form__section-description' },
                                section.description
                              )
                            : null,
                        ]),
                      ])
                    ) as VNode[]),
                  h(AdminForm, {
                    formApi: api,
                    gridColumns: currentColumns,
                    showDefaultActions: false,
                    visibleFieldNames: currentStep.fieldNames,
                  }),
                ]
              ),
            ]),
            h('div', { class: 'admin-form-page__footer' }, [
              h(
                'button',
                {
                  class: 'admin-form__button',
                  type: 'button',
                  onClick: () => {
                    void handleClose();
                  },
                },
                allProps.value.cancelText ?? localeMessages.value.cancel
              ),
              h(
                'button',
                {
                  class: 'admin-form__button',
                  disabled: footerState.previousDisabled,
                  type: 'button',
                  onClick: () => {
                    void handlePrev();
                  },
                },
                allProps.value.prevText ?? localeMessages.value.previous
              ),
              h(
                'button',
                {
                  class: 'admin-form__button admin-form__button--primary',
                  type: 'button',
                  onClick: () => {
                    void handleNext();
                  },
                },
                resolveSubmitPagePrimaryActionLabel({
                  activeStep: footerState.safeActiveStep,
                  nextText: allProps.value.nextText ?? localeMessages.value.next,
                  submitText: allProps.value.submitText ?? localeMessages.value.submit,
                  totalSteps: footerState.totalSteps,
                })
              ),
            ]),
          ]
        ),
      ]);
    };
  },
}) as unknown as DefineComponent<AdminFormSubmitPageVueProps>;
