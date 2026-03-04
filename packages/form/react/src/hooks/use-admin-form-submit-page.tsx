/**
 * Form React 提交页 Hook。
 * @description 管理提交页开关状态、步骤状态与控制器桥接，输出可复用提交页组件。
 */
import {
  buildSteppedFormSchema,
  clampStepIndex,
  createFormApi,
  createSubmitPageControllerBridge,
  mergeFormProps,
  resolveSubmitPageFormProps,
  resolveSubmitPageSubmitHandler,
  syncSubmitPageStep,
  type AdminFormStepChangePayload,
  type AdminFormSteppedSubmitHandler,
  type ResolvedAdminFormStepSchema,
} from '@admin-core/form-core';
import type { AdminFormApi } from '@admin-core/form-core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AdminFormSubmitPageReactProps,
  UseAdminFormSubmitPageComponentProps,
  UseAdminFormSubmitPageOptions,
  UseAdminFormSubmitPageReturn,
} from '../types';
import type { ComponentType } from 'react';

import { AdminFormSubmitPage } from '../components/AdminFormSubmitPage';

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
 * 创建分步提交页 Hook（React）。
 *
 * @param options 提交页初始化配置。
 * @returns `[FormSubmitPage, formApi, controller]` 元组。
 */
export function useAdminFormSubmitPage(
  options: UseAdminFormSubmitPageOptions
): UseAdminFormSubmitPageReturn {
  /** 开关状态快照，供控制器与渲染流程共享。 */
  const openSnapshotRef = useRef<boolean>(!!options.open);
  /** 内部开关状态（非受控场景使用）。 */
  const [internalOpen, setInternalOpen] = useState<boolean>(openSnapshotRef.current);
  /** 初次构建的分步结构，避免 Hook 生命周期内重复重建。 */
  const bootStepped = useMemo(
    () =>
      buildSteppedFormSchema(options.steps ?? [], {
        includeSectionDivider: false,
        rowColumns: options.rowColumns ?? 1,
        stepFieldName: options.stepFieldName,
      }),
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    []
  );
  /** 表单 API 引用，保证 Hook 生命周期内实例稳定。 */
  const apiRef = useRef<AdminFormApi | null>(null);
  if (!apiRef.current) {
    apiRef.current = createFormApi(
      resolveSubmitPageFormProps(options as any, bootStepped.schema)
    );
  }
  const api = apiRef.current;
  /** 最新 options 快照，供稳定回调读取。 */
  const optionsRef = useRef(options);
  optionsRef.current = options;
  /** 当前步骤索引快照。 */
  const stepSnapshotRef = useRef<number>(
    clampStepIndex(options.initialStep ?? 0, bootStepped.steps.length || 1)
  );
  /** 当前步骤配置快照（步骤字段名 + 步骤数组）。 */
  const stepConfigRef = useRef<SubmitPageStepConfigSnapshot>({
    stepFieldName: bootStepped.stepFieldName,
    steps: bootStepped.steps,
  });
  /** 当前生效事件回调快照。 */
  const callbackRef = useRef<SubmitPageCallbackRefState>({});
  /** 当前提交流程处理器快照。 */
  const submitHandlerRef = useRef<AdminFormSteppedSubmitHandler | undefined>(
    resolveSubmitPageSubmitHandler(options as any)
  );
  /** 受控初始步骤状态，用于与外部传参协同。 */
  const [controlledInitialStep, setControlledInitialStep] = useState(
    stepSnapshotRef.current
  );
  /** 受控初始步骤引用，供稳定闭包读取。 */
  const controlledInitialStepRef = useRef(stepSnapshotRef.current);
  /** 内部开关状态引用，供稳定闭包读取。 */
  const internalOpenRef = useRef(internalOpen);

  /**
   * 设置提交页开关状态。
   *
   * @param open 目标开关状态。
   * @returns 无返回值。
   */
  const setOpen = useCallback((open: boolean) => {
    openSnapshotRef.current = open;
    internalOpenRef.current = open;
    setInternalOpen((previous) => (previous === open ? previous : open));
  }, []);

  /**
   * 切换到指定步骤并同步表单步骤字段。
   *
   * @param step 目标步骤索引。
   * @param steps 当前步骤列表。
   * @returns 校正后的步骤索引。
   */
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

  /** 同步外部 `open` 到内部快照。 */
  useEffect(() => {
    if (typeof options.open === 'boolean') {
      setOpen(options.open);
    }
  }, [options.open, setOpen]);

  /** 刷新内部开关引用。 */
  useEffect(() => {
    internalOpenRef.current = internalOpen;
  }, [internalOpen]);

  /** 同步外部初始步骤到当前步骤快照。 */
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

  /** 刷新受控初始步骤引用。 */
  useEffect(() => {
    controlledInitialStepRef.current = controlledInitialStep;
  }, [controlledInitialStep]);

  /** Hook 卸载时清理内部创建的 API。 */
  useEffect(() => {
    return () => {
      api.unmount();
    };
  }, [api]);

  /** 提交页控制器实例，提供开关、步骤与提交控制能力。 */
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

  /** Hook 返回的提交页组件引用，保证组件身份稳定。 */
  const formSubmitPageRef = useRef<ComponentType<UseAdminFormSubmitPageComponentProps> | null>(
    null
  );
  if (!formSubmitPageRef.current) {
    /**
     * Hook 返回的提交页渲染组件。
     * @description 合并 Hook 初始化参数与调用时覆盖参数，并保持控制器快照同步。
     * @param props 组件覆盖属性。
     * @returns 提交页节点。
     */
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
      /** 最终开关值：优先 props 受控，其次内部状态。 */
      const resolvedOpen = typeof propOpen === 'boolean' ? propOpen : internalOpenRef.current;
      openSnapshotRef.current = resolvedOpen;
      /** 最终初始步骤：优先 props，回退到受控引用与初始化配置。 */
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
  const FormSubmitPage = formSubmitPageRef.current as ComponentType<
    UseAdminFormSubmitPageComponentProps
  >;

  return [FormSubmitPage, api, controller] as const;
}
