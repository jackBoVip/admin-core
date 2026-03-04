/**
 * Form Vue 提交页 Hook。
 * @description 管理提交页开关状态、步骤状态与控制器桥接，输出可复用提交页组件。
 */
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

/**
 * 分步表单运行时快照。
 */
interface SubmitPageStepConfigSnapshot {
  /** 当前步骤字段名。 */
  stepFieldName: string;
  /** 当前步骤配置列表。 */
  steps: ResolvedAdminFormStepSchema[];
}

/**
 * 分步提交页事件回调集合。
 */
interface SubmitPageCallbackRefState {
  /** 抽屉开关变化回调。 */
  onOpenChange?: (open: boolean) => void;
  /** 步骤变化回调。 */
  onStepChange?: (payload: AdminFormStepChangePayload) => void;
}

/**
 * 创建分步提交页 Hook（Vue）。
 *
 * @param options 提交页初始化配置。
 * @returns `[FormSubmitPage, formApi, controller]` 元组。
 */
export function useAdminFormSubmitPage(
  options: UseAdminFormSubmitPageOptions
): UseAdminFormSubmitPageReturn {
  /** 初次构建的分步结构。 */
  const bootStepped = buildSteppedFormSchema(options.steps ?? [], {
    includeSectionDivider: false,
    rowColumns: options.rowColumns ?? 1,
    stepFieldName: options.stepFieldName,
  });
  /** Hook 生命周期内复用的表单 API。 */
  const api = createFormApi(
    resolveSubmitPageFormProps(options as any, bootStepped.schema)
  );
  /** 开关状态快照。 */
  const openSnapshot = ref(!!options.open);
  /** 当前步骤索引快照。 */
  const stepSnapshot = ref(
    clampStepIndex(options.initialStep ?? 0, bootStepped.steps.length || 1)
  );
  /** 当前步骤配置快照（步骤字段名 + 步骤数组）。 */
  const stepConfig = ref<SubmitPageStepConfigSnapshot>({
    stepFieldName: bootStepped.stepFieldName,
    steps: bootStepped.steps,
  });
  /** 当前事件回调集合快照。 */
  const callbacks = ref<SubmitPageCallbackRefState>({});
  /** 当前提交流程处理器快照。 */
  const submitHandler = ref(
    resolveSubmitPageSubmitHandler(options as any)
  );
  /** 受控初始步骤快照。 */
  const controlledInitialStep = ref(stepSnapshot.value);

  /**
   * 设置提交页开关状态。
   *
   * @param open 目标开关状态。
   * @returns 无返回值。
   */
  function setOpen(open: boolean) {
    openSnapshot.value = open;
  }

  /**
   * 切换到指定步骤并同步表单步骤字段。
   *
   * @param step 目标步骤索引。
   * @param steps 当前步骤列表。
   * @returns 校正后的步骤索引。
   */
  async function setStep(step: number, steps = stepConfig.value.steps) {
    const safeStep = clampStepIndex(step, steps.length || 1);
    stepSnapshot.value = safeStep;
    controlledInitialStep.value = safeStep;
    await syncSubmitPageStep(api, stepConfig.value.stepFieldName, safeStep, true);
    return safeStep;
  }

  /** 提交页控制器，负责外部命令与内部状态桥接。 */
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

  /**
   * Hook 返回的提交页组件。
   * @description 合并 Hook 初始化参数、组件 attrs 与 props，输出最终提交页节点。
   */
  const FormSubmitPage = defineComponent(
    (props: UseAdminFormSubmitPageComponentProps, { attrs, expose }) => {
      /** 卸载时释放 Hook 内创建的 API 资源。 */
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
        /** 最终开关值：优先 props/attrs 受控，其次内部快照。 */
        const resolvedOpen = typeof propOpen === 'boolean'
          ? propOpen
          : typeof attrOpen === 'boolean'
            ? attrOpen
            : openSnapshot.value;
        openSnapshot.value = resolvedOpen;
        /** 最终初始步骤：优先 props/attrs，回退到受控快照与初始化配置。 */
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
