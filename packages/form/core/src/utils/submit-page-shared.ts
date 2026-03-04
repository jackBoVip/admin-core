/**
 * Form Core 提交页共享工具。
 * @description 提供提交页步骤流转、关闭重置策略与显示状态计算能力。
 */
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
  AdminFormSubmitPageBaseProps,
  AdminFormSubmitPageController,
  AdminFormSubmitPageNextResult,
  AdminFormSchema,
  AdminFormStepAnimation,
  AdminFormStepChangePayload,
  AdminFormStepDirection,
  AdminFormProps,
  AdminFormSteppedSubmitContext,
  AdminFormSteppedSubmitHandler,
  ResolvedAdminFormStepSchema,
} from '../types';

/**
 * 生成提交页面板样式，兼容 `modal` 与 `drawer` 两种模式。
 * @param mode 提交页展示模式。
 * @param width 面板宽度配置。
 * @returns 面板内联样式对象。
 */
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

/**
 * 解析提交页面板类名。
 * @param input 面板状态和模式配置。
 * @returns 面板类名字符串。
 */
export function resolveSubmitPagePanelClassName(input: {
  /** 抽屉模式下的位置。 */
  drawerPlacement?: AdminFormSubmitPageBaseProps['drawerPlacement'];
  /** 面板模式。 */
  mode?: AdminFormSubmitPageBaseProps['mode'];
  /** 当前是否打开。 */
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

/**
 * 根据步骤动画和方向生成步骤容器类名。
 * @param input 动画与方向配置。
 * @returns 步骤面板类名。
 */
export function resolveSubmitPageStepPanelClassName(input: {
  /** 步骤动画模式。 */
  animation?: AdminFormStepAnimation;
  /** 步骤切换方向。 */
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

/**
 * 计算关闭提交页后的自动重置计划。
 * @param input 打开状态与重置策略。
 * @returns 是否需要重置及下一个跳过标记。
 */
export function resolveSubmitPageCloseResetPlan(input: {
  /** 当前打开状态。 */
  open: boolean;
  /** 上一次打开状态。 */
  previousOpen: boolean;
  /** 关闭时是否自动重置。 */
  resetOnClose: boolean;
  /** 是否跳过下一次自动重置。 */
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

/**
 * 解析主按钮文案（下一步/提交）。
 * @param input 当前步骤与按钮文案配置。
 * @returns 主按钮文案。
 */
export function resolveSubmitPagePrimaryActionLabel(input: {
  /** 当前激活步骤索引。 */
  activeStep: number;
  /** “下一步”文案。 */
  nextText?: string;
  /** “提交”文案。 */
  submitText?: string;
  /** 总步骤数。 */
  totalSteps: number;
}): string | undefined {
  if (input.activeStep >= input.totalSteps - 1) {
    return input.submitText;
  }
  return input.nextText;
}

/**
 * 计算提交页当前视图状态。
 * @param input 步骤和布局配置。
 * @returns 当前步骤、列数及边界状态。
 */
export function resolveSubmitPageViewState(input: {
  /** 当前步骤索引。 */
  activeStep: number;
  /** 默认列数配置。 */
  rowColumns?: number;
  /** 已解析的步骤列表。 */
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

/**
 * 解析单个步骤项在头部导航中的状态。
 * @param input 步骤索引与当前激活步骤信息。
 * @returns 步骤项渲染状态。
 */
export function resolveSubmitPageStepItemState(input: {
  /** 当前激活步骤索引。 */
  activeStep: number;
  /** 索引。 */
  index: number;
  /** 当前步骤定义。 */
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

/**
 * 构建步骤头部导航项列表。
 * @param input 当前步骤索引与步骤数组。
 * @returns 头部步骤渲染数据。
 */
export function resolveSubmitPageStepHeaderItems(input: {
  /** 当前激活步骤索引。 */
  activeStep: number;
  /** 已解析步骤数组。 */
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

/**
 * 计算提交页底部操作区状态。
 * @param input 当前步骤与总步骤信息。
 * @returns 底部按钮可用状态。
 */
export function resolveSubmitPageFooterState(input: {
  /** 当前步骤索引。 */
  activeStep: number;
  /** 总步骤数。 */
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

/**
 * 判断是否展示步骤头部。
 * @param showStepHeader 显式开关；未设置时默认展示。
 * @param totalSteps 总步骤数。
 * @returns 是否显示步骤头部。
 */
export function shouldShowSubmitPageStepHeader(
  showStepHeader: boolean | undefined,
  totalSteps: number
) {
  return (showStepHeader ?? true) && totalSteps > 1;
}

/**
 * 过滤当前步骤中需要展示在步骤头信息区的分组。
 * @param step 当前步骤定义。
 * @returns 仅保留存在标题或描述的分组。
 */
export function resolveSubmitPageDisplaySections(
  step: ResolvedAdminFormStepSchema | undefined
) {
  if (!step) {
    return [] as ResolvedAdminFormStepSchema['sections'];
  }
  return step.sections.filter((section) => !!(section.title || section.description));
}

/**
 * 从提交页配置中提取并组装内部表单 props。
 * @param props 提交页基础配置。
 * @param schema 渲染用表单 schema。
 * @returns 供内部 `AdminForm` 使用的 props。
 */
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

/**
 * 解析提交回调，兼容 `onSubmit` 与 `handleSubmit` 两种写法。
 * @param props 提交相关配置。
 * @returns 最终可调用的提交处理器。
 */
export function resolveSubmitPageSubmitHandler(
  props: Pick<AdminFormSubmitPageBaseProps, 'handleSubmit' | 'onSubmit'>
): AdminFormSteppedSubmitHandler | undefined {
  return props.onSubmit ?? props.handleSubmit;
}

/**
 * 创建分步提交上下文。
 * @param api 表单 API。
 * @param activeStep 当前步骤索引。
 * @returns 分步提交上下文对象。
 */
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

/**
 * 将当前步骤索引同步到表单字段。
 * @param api 表单 API。
 * @param stepFieldName 步骤字段名。
 * @param step 目标步骤索引。
 * @param shouldValidate 设置字段时是否触发校验。
 * @returns 无返回值。
 */
export async function syncSubmitPageStep(
  api: AdminFormApi,
  stepFieldName: string,
  step: number,
  shouldValidate = false
) {
  await api.setFieldValue(stepFieldName, step, shouldValidate);
}

/**
 * 执行“上一步”行为。
 * @param input 当前步骤与切换能力。
 * @returns 是否成功切换到上一步。
 */
export async function submitPagePrevStep(input: {
  /** 当前步骤索引。 */
  activeStep: number;
  /** 应用步骤变更的方法。 */
  applyStepChange: (
    nextStep: number,
    steps: ResolvedAdminFormStepSchema[]
  ) => Promise<void>;
  /** 全量步骤定义。 */
  steps: ResolvedAdminFormStepSchema[];
}) {
  if (input.activeStep <= 0) {
    return false;
  }
  await input.applyStepChange(input.activeStep - 1, input.steps);
  return true;
}

/**
 * 执行“下一步/提交”行为，包含分步校验、跳转与最终提交。
 * @param input 当前步骤上下文。
 * @returns 下一步执行结果。
 */
export async function submitPageNextStep(input: {
  /** 当前步骤索引。 */
  activeStep: number;
  /** 表单 API。 */
  api: AdminFormApi;
  /** 应用步骤切换的方法。 */
  applyStepChange: (
    nextStep: number,
    steps: ResolvedAdminFormStepSchema[]
  ) => Promise<void>;
  /** 提交完成后控制打开状态变化。 */
  onOpenChange?: (open: boolean) => void;
  /** 步骤字段名。 */
  stepFieldName: string;
  /** 已解析步骤列表。 */
  steps: ResolvedAdminFormStepSchema[];
  /** 最终提交处理函数。 */
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

/**
 * 提交页控制器桥接层输入参数。
 */
export interface SubmitPageControllerBridgeInput {
  /** 获取当前激活步骤。 */
  getActiveStep: () => number;
  /** 获取当前打开状态。 */
  getOpen: () => boolean;
  /** 获取步骤字段名。 */
  getStepFieldName: () => string;
  /** 获取步骤定义列表。 */
  getSteps: () => ResolvedAdminFormStepSchema[];
  /** 获取提交处理器。 */
  getSubmitHandler: () => AdminFormSteppedSubmitHandler | undefined;
  /** 打开状态变化时触发。 */
  onOpenChange?: (open: boolean) => void;
  /** 提交成功后触发。 */
  onSubmitted?: () => Promise<void> | void;
  /** 步骤变化时触发。 */
  onStepChange?: (payload: AdminFormStepChangePayload) => void;
  /** 设置打开状态。 */
  setOpen: (open: boolean) => void;
  /** 设置当前步骤。 */
  setStep: (
    step: number,
    steps?: ResolvedAdminFormStepSchema[]
  ) => Promise<number>;
}

/**
 * 提交页控制器桥接创建结果。
 */
export interface SubmitPageControllerBridge {
  /** 应用步骤切换并触发回调。 */
  applyStepChange: (
    nextStep: number,
    steps: ResolvedAdminFormStepSchema[]
  ) => Promise<void>;
  /** 对外暴露的提交页控制器。 */
  controller: AdminFormSubmitPageController;
}

/**
 * 创建提交页控制器桥接对象，统一封装步骤切换与开关行为。
 * @param api 表单 API。
 * @param input 控制器桥接依赖。
 * @returns 控制器实例与步骤切换函数。
 */
export function createSubmitPageControllerBridge(
  api: AdminFormApi,
  input: SubmitPageControllerBridgeInput
): SubmitPageControllerBridge {
  /**
   * 应用步骤变更并触发步骤变更事件。
   * @param nextStep 目标步骤索引。
   * @param steps 当前步骤列表。
   * @returns 无返回值。
   */
  const applyStepChange = async (
    nextStep: number,
    steps: ResolvedAdminFormStepSchema[]
  ) => {
    const previousStep = input.getActiveStep();
    const safeStep = await input.setStep(nextStep, steps);
    const payload = resolveStepChangePayload(steps, previousStep, safeStep);
    input.onStepChange?.(payload);
  };

  /**
   * 更新弹窗开关状态并通知外部监听器。
   * @param open 目标开关状态。
   * @returns 无返回值。
   */
  const setOpenAndNotify = (open: boolean) => {
    input.setOpen(open);
    input.onOpenChange?.(open);
  };

  const controller: AdminFormSubmitPageController = {
    /**
     * 关闭提交页。
     * @returns 无返回值。
     */
    close() {
      setOpenAndNotify(false);
    },
    /**
     * 获取表单 API。
     * @returns 表单 API 实例。
     */
    getFormApi() {
      return api;
    },
    /**
     * 获取当前打开状态。
     * @returns 当前打开状态。
     */
    getOpen() {
      return input.getOpen();
    },
    /**
     * 获取当前步骤索引。
     * @returns 当前步骤索引。
     */
    getStep() {
      return input.getActiveStep();
    },
    /**
     * 获取步骤总数。
     * @returns 总步骤数。
     */
    getTotalSteps() {
      return input.getSteps().length;
    },
    /**
     * 跳转到指定步骤。
     * @param step 目标步骤索引。
     * @returns 实际设置后的步骤索引。
     */
    async goToStep(step: number) {
      return await input.setStep(step, input.getSteps());
    },
    /**
     * 执行下一步逻辑（校验/提交/关闭）。
     * @returns 下一步执行结果。
     */
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
    /**
     * 打开提交页。
     * @returns 无返回值。
     */
    open() {
      setOpenAndNotify(true);
    },
    /**
     * 回退到上一步。
     * @returns 是否成功回退。
     */
    async prev() {
      return await submitPagePrevStep({
        activeStep: input.getActiveStep(),
        applyStepChange,
        steps: input.getSteps(),
      });
    },
    /**
     * 设置打开状态。
     * @param open 目标打开状态。
     * @returns 无返回值。
     */
    setOpen(open: boolean) {
      setOpenAndNotify(open);
    },
    /**
     * 切换打开状态。
     * @param open 可选目标状态；不传则取反。
     * @returns 无返回值。
     */
    toggle(open?: boolean) {
      setOpenAndNotify(typeof open === 'boolean' ? open : !input.getOpen());
    },
  };

  return {
    applyStepChange,
    controller,
  };
}
