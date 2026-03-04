/**
 * Form Core UI 共享工具。
 * @description 提供组件解析、动作区布局与渲染辅助等无框架 UI 计算能力。
 */
import { isString } from './guards';
import type {
  AdminFormApi,
  FormAdapterRegistry,
  RenderFieldItem,
  ResolvedComponentBinding,
} from '../types';

/**
 * 归一化组件事件回调值，兼容原生事件对象、框架包装对象与直接值。
 * @param eventOrValue 组件回调返回的事件对象或原始值。
 * @param modelPropName 组件值属性名（如 `value`、`checked`）。
 * @returns 归一化后的字段值。
 */
export function normalizeEventValue(eventOrValue: any, modelPropName: string) {
  if (eventOrValue && typeof eventOrValue === 'object' && 'target' in eventOrValue) {
    const target = (eventOrValue as { /** 事件对象上的 `target` 节点。 */
      target?: Record<string, any>;
    }).target;
    if (target && modelPropName in target) {
      return target[modelPropName];
    }
    if (target && 'value' in target) {
      return target.value;
    }
  }

  if (eventOrValue && typeof eventOrValue === 'object' && modelPropName in eventOrValue) {
    return (eventOrValue as Record<string, any>)[modelPropName];
  }

  if (eventOrValue && typeof eventOrValue === 'object') {
    const eventRecord = eventOrValue as Record<string, any>;
    const hasWrappedEventMarker = Object.keys(eventRecord).some((key) =>
      key.startsWith('$')
    );
    if (hasWrappedEventMarker) {
      if ('value' in eventRecord) {
        return eventRecord.value;
      }
      if ('checked' in eventRecord) {
        return eventRecord.checked;
      }
    }
  }

  return eventOrValue;
}

/**
 * 解析字段组件注册键。
 * @param field 字段渲染配置。
 * @returns 组件键；非字符串组件时回退为 `input`。
 */
export function getFieldComponentKey(field: Pick<RenderFieldItem, 'component'>) {
  return isString(field.component) ? field.component : 'input';
}

/**
 * 渲染文本型内容，支持直接值与函数渲染器。
 * @param content 文本内容或返回文本的函数。
 * @returns 最终可渲染内容；空值返回 `null`。
 */
export function renderTextContent(content: any) {
  if (!content) return null;
  if (typeof content === 'function') return content();
  return content;
}

/**
 * 生成表单操作区容器类名。
 * @param input 操作区布局与定位配置。
 * @returns 合并后的类名字符串。
 */
export function buildActionClass(input: {
  /** 操作区布局模式。 */
  actionLayout?: 'inline' | 'newLine' | 'rowEnd';
  /** 操作按钮对齐位置。 */
  actionPosition?: 'center' | 'left' | 'right';
  /** 额外追加的外层类名。 */
  actionWrapperClass?: string;
}) {
  const classes = ['admin-form__actions'];
  switch (input.actionPosition) {
    case 'left':
      classes.push('admin-form__actions--left');
      break;
    case 'center':
      classes.push('admin-form__actions--center');
      break;
    default:
      classes.push('admin-form__actions--right');
      break;
  }

  switch (input.actionLayout) {
    case 'inline':
      classes.push('admin-form__actions--layout-inline');
      break;
    case 'newLine':
      classes.push('admin-form__actions--layout-new-line');
      break;
    default:
      classes.push('admin-form__actions--layout-row-end');
      break;
  }

  if (input.actionWrapperClass) {
    classes.push(input.actionWrapperClass);
  }

  return classes.join(' ');
}

/**
 * 规范化按钮配置，统一提取显示文案、类名、事件和透传属性。
 * @param options 原始按钮配置。
 * @returns 归一化后的按钮配置对象。
 */
export function normalizeButtonOptions(options: Record<string, any> | undefined) {
  const {
    content,
    show = true,
    onClick,
    class: classNameAlias,
    className,
    ...attrs
  } = options ?? {};
  return {
    attrs,
    className: (className ?? classNameAlias) as string | undefined,
    content,
    onClick: onClick as ((event: any) => void) | undefined,
    show: show !== false,
  };
}

/**
 * 默认操作按钮多语言文案集合。
 */
export interface FormActionMessages {
  /** 折叠按钮文案。 */
  collapse: string;
  /** 展开按钮文案。 */
  expand: string;
  /** 重置按钮文案。 */
  reset: string;
  /** 提交按钮文案。 */
  submit: string;
}

/**
 * 单个操作按钮的渲染计划。
 */
export interface FormActionButtonPlan {
  /** 键名。 */
  key: 'reset' | 'submit';
  /** 显示标签。 */
  label: any;
  /** 配置项。 */
  options: ReturnType<typeof normalizeButtonOptions>;
  /** 按钮视觉变体。 */
  variant: 'default' | 'primary';
}

/**
 * 操作区完整渲染计划（按钮 + 折叠触发器）。
 */
export interface FormActionPlan {
  /** 主操作按钮列表。 */
  buttons: FormActionButtonPlan[];
  /** 折叠触发器配置；为空表示不显示。 */
  collapse: null | {
    /** 键名。 */
    key: 'collapse';
    /** 显示标签。 */
    label: string;
  };
}

/**
 * 操作区渲染项联合类型。
 */
export type FormActionRenderItem =
  | {
      /** 操作类型标识。 */
      actionKey: 'reset' | 'submit';
      /** 按钮后置插槽名。 */
      afterSlot: null;
      /** 按钮前置插槽名。 */
      beforeSlot: 'reset-before' | 'submit-before';
      /** 渲染项类别。 */
      kind: 'button';
      /** 显示标签。 */
      label: any;
      /** 配置项。 */
      options: ReturnType<typeof normalizeButtonOptions>;
      /** 按钮视觉变体。 */
      variant: 'default' | 'primary';
    }
  | {
      /** 操作类型标识。 */
      actionKey: 'collapse';
      /** 折叠项后置插槽名。 */
      afterSlot: 'expand-after';
      /** 折叠项前置插槽名。 */
      beforeSlot: 'expand-before';
      /** 渲染项类别。 */
      kind: 'collapse';
      /** 显示标签。 */
      label: string;
    };

/**
 * 操作区行为处理器集合。
 */
export interface FormActionHandlers {
  /** 点击折叠/展开按钮时触发。 */
  onCollapse: () => void | Promise<void>;
  /** 点击重置按钮时触发。 */
  onReset: () => void | Promise<void>;
  /** 点击提交按钮时触发。 */
  onSubmit: () => void | Promise<void>;
}

/**
 * 根据表单配置生成操作区渲染计划。
 * @param input 操作区开关、文案与按钮配置。
 * @returns 可渲染的计划对象；禁用默认操作时返回 `null`。
 */
export function resolveFormActionPlan(input: {
  /** 是否反转默认按钮顺序。 */
  actionButtonsReverse?: boolean;
  /** 当前是否处于折叠状态。 */
  collapsed?: boolean;
  /** 操作文案集合。 */
  messages: FormActionMessages;
  /** 重置按钮配置。 */
  resetButtonOptions?: Record<string, any>;
  /** 是否显示折叠/展开按钮。 */
  showCollapseButton?: boolean;
  /** 是否显示默认重置/提交按钮。 */
  showDefaultActions?: boolean;
  /** 提交按钮配置。 */
  submitButtonOptions?: Record<string, any>;
}): FormActionPlan | null {
  if (input.showDefaultActions === false) {
    return null;
  }

  const resetOptions = normalizeButtonOptions(input.resetButtonOptions);
  const submitOptions = normalizeButtonOptions(input.submitButtonOptions);

  const resetButton: FormActionButtonPlan = {
    key: 'reset',
    label: resetOptions.content || input.messages.reset,
    options: resetOptions,
    variant: 'default',
  };
  const submitButton: FormActionButtonPlan = {
    key: 'submit',
    label: submitOptions.content || input.messages.submit,
    options: submitOptions,
    variant: 'primary',
  };
  const orderedButtons = input.actionButtonsReverse
    ? [submitButton, resetButton]
    : [resetButton, submitButton];

  return {
    buttons: orderedButtons.filter((button) => button.options.show),
    collapse: input.showCollapseButton
      ? {
          key: 'collapse',
          label: input.collapsed ? input.messages.expand : input.messages.collapse,
        }
      : null,
  };
}

/**
 * 将操作计划转换为渲染层可直接消费的扁平数据。
 * @param plan 操作区渲染计划。
 * @returns 渲染项数组。
 */
export function resolveFormActionRenderItems(
  plan: FormActionPlan | null
): FormActionRenderItem[] {
  if (!plan) {
    return [];
  }

  const items: FormActionRenderItem[] = plan.buttons.map((button) => ({
    kind: 'button',
    actionKey: button.key,
    beforeSlot: button.key === 'reset' ? 'reset-before' : 'submit-before',
    afterSlot: null,
    label: button.label,
    options: button.options,
    variant: button.variant,
  }));

  if (plan.collapse) {
    items.push({
      kind: 'collapse',
      actionKey: 'collapse',
      beforeSlot: 'expand-before',
      afterSlot: 'expand-after',
      label: plan.collapse.label,
    });
  }

  return items;
}

/**
 * 构建操作按钮类名。
 * @param input 按钮变体和附加类名。
 * @returns 按钮最终类名字符串。
 */
export function buildFormActionButtonClass(input: {
  /** 样式类名。 */
  className?: string;
  /** 按钮变体类型。 */
  variant: 'collapse' | 'default' | 'primary';
}) {
  if (input.variant === 'collapse') {
    return 'admin-form__collapse-trigger';
  }
  return [
    'admin-form__button',
    input.variant === 'primary' ? 'admin-form__button--primary' : '',
    input.className ?? '',
  ].join(' ');
}

/**
 * 处理操作区点击事件，按渲染项类型路由到对应处理器。
 * @param item 被点击的渲染项。
 * @param event 原始点击事件对象。
 * @param handlers 操作处理器集合。
 * @returns 无返回值。
 */
export async function handleFormActionItemClick(
  item: FormActionRenderItem,
  event: {
    /** 事件是否已被阻止默认行为。 */
    defaultPrevented?: boolean;
    /** 阻止默认行为的方法。 */
    preventDefault?: () => void;
  },
  handlers: FormActionHandlers
) {
  if (item.kind === 'collapse') {
    event.preventDefault?.();
    await handlers.onCollapse();
    return;
  }

  item.options.onClick?.(event);
  if (event.defaultPrevented) {
    return;
  }
  event.preventDefault?.();
  if (item.actionKey === 'reset') {
    await handlers.onReset();
  } else {
    await handlers.onSubmit();
  }
}

/**
 * 计算字段组件自定义渲染内容映射。
 * @param field 字段定义对象。
 * @param values 当前表单值。
 * @param api 表单 API。
 * @returns 渲染内容映射；未配置渲染器时返回 `undefined`。
 */
export function getRenderComponentContentMap(
  field: Pick<RenderFieldItem, 'renderComponentContent'>,
  values: Record<string, any>,
  api: AdminFormApi
) {
  if (typeof field.renderComponentContent !== 'function') {
    return undefined;
  }
  return field.renderComponentContent(values, api) ?? {};
}

/**
 * 解析并执行组件内容渲染函数，返回已处理的渲染内容。
 * @param input 字段、表单值与 API 上下文。
 * @returns 渲染内容映射。
 */
export function resolveRenderedComponentContent(input: {
  /** 表单 API。 */
  api: AdminFormApi;
  /** 字段定义。 */
  field: Pick<RenderFieldItem, 'renderComponentContent'>;
  /** 当前表单值。 */
  values: Record<string, any>;
}) {
  const content = getRenderComponentContentMap(input.field, input.values, input.api);
  if (!content) {
    return undefined;
  }
  const rendered: Record<string, any> = {};
  for (const [name, value] of Object.entries(content)) {
    rendered[name] = renderTextContent(value);
  }
  return rendered;
}

/**
 * 拆分组件渲染内容，将 `default` 插槽与其余属性分离。
 * @param content 组件内容映射。
 * @returns 拆分后的默认内容和组件透传属性。
 */
export function splitRenderedComponentContent(
  content: Record<string, any> | undefined
) {
  const renderComponentProps: Record<string, any> = {};
  let defaultContent: any = undefined;
  if (!content) {
    return {
      defaultContent,
      renderComponentProps,
    };
  }

  for (const [name, value] of Object.entries(content)) {
    if (name === 'default') {
      defaultContent = value;
      continue;
    }
    renderComponentProps[name] = value;
  }
  return {
    defaultContent,
    renderComponentProps,
  };
}

/**
 * 生成组件解析缓存键，避免重复解析适配器组件。
 * @param input 组件解析上下文。
 * @returns 缓存键字符串。
 */
export function createResolvedBindingCacheKey(input: {
  /** 当前启用的组件库标识。 */
  activeLibrary: string;
  /** 组件键。 */
  componentKey: string;
  /** 字段级 model 属性名。 */
  fieldModelPropName?: string;
  /** 全局默认 model 属性名。 */
  globalModelPropName?: string;
}) {
  return [
    input.globalModelPropName ?? '',
    input.fieldModelPropName ?? '',
    input.activeLibrary,
    input.componentKey,
  ].join('|');
}

/**
 * 构建控件状态属性，供样式和状态渲染使用。
 * @param resolvedStatus 字段当前状态（如 `error`、`warning`）。
 * @returns 控件状态属性对象。
 */
export function buildControlStateAttrs(resolvedStatus: any) {
  if (!resolvedStatus) {
    return {};
  }
  return {
    'data-admin-invalid': resolvedStatus === 'error' ? 'true' : undefined,
    'data-admin-status': resolvedStatus,
  };
}

/**
 * 构建组件层状态属性，包含无障碍属性与内部状态属性。
 * @param resolvedStatus 字段当前状态。
 * @returns 组件状态属性对象。
 */
export function buildComponentStateAttrs(resolvedStatus: any) {
  if (!resolvedStatus) {
    return {};
  }
  return {
    'aria-invalid': resolvedStatus === 'error',
    ...buildControlStateAttrs(resolvedStatus),
  };
}

/**
 * 判断字段是否应隐藏。
 * @param field 字段渲染状态。
 * @returns `true` 表示字段不可见。
 */
export function isFieldHiddenByState(field: Pick<RenderFieldItem, 'hide' | 'runtime'>) {
  return !!field.hide || !field.runtime.isIf || !field.runtime.isShow;
}

/**
 * 解析字段对应的实际组件绑定信息，并按条件写入缓存。
 * @param input 字段与适配器解析上下文。
 * @returns 组件键与解析结果。
 */
export function resolveFieldComponentBinding<TComponent>(input: {
  /** 组件解析缓存。 */
  cache: Map<string, ResolvedComponentBinding<TComponent> | null>;
  /** 字段配置。 */
  field: Pick<RenderFieldItem, 'component' | 'modelPropName'>;
  /** 全局 model 属性名。 */
  globalModelPropName?: string;
  /** 组件适配器注册中心。 */
  registry: Pick<FormAdapterRegistry<TComponent>, 'getActiveLibrary' | 'resolveComponent'>;
}) {
  const key = getFieldComponentKey(input.field);
  const explicitComponent =
    typeof input.field.component === 'string'
      ? undefined
      : (input.field.component as TComponent);
  const shouldCache = explicitComponent === undefined;
  const cacheKey = shouldCache
    ? createResolvedBindingCacheKey({
        activeLibrary: input.registry.getActiveLibrary(),
        componentKey: key,
        fieldModelPropName: input.field.modelPropName,
        globalModelPropName: input.globalModelPropName,
      })
    : '';

  let resolved = shouldCache ? input.cache.get(cacheKey) : undefined;
  if (resolved === undefined) {
    resolved = input.registry.resolveComponent({
      key,
      explicitComponent,
    });
    if (shouldCache) {
      input.cache.set(cacheKey, resolved);
    }
  }
  return {
    key,
    resolved,
  };
}

/**
 * 字段运行时渲染上下文。
 */
export interface ResolvedFieldRuntimeContext {
  /** 合并后的公共配置。 */
  commonConfig: Record<string, any>;
  /** 是否禁用。 */
  disabled: boolean;
  /** 最终用于渲染的字段值。 */
  displayModelValue: any;
  /** 字段实际使用的 model 属性名。 */
  fieldModelPropName: string;
  /** 是否隐藏标签。 */
  hideLabel: boolean;
  /** 是否隐藏必填星号。 */
  hideRequiredMark: boolean;
  /** 必填星号是否跟随主题色。 */
  requiredMarkFollowTheme: boolean;
  /** 标签对齐方式。 */
  labelAlign: 'left' | 'right';
  /** 标签宽度。 */
  labelWidth: number;
  /** 字段组件原始属性。 */
  rawFieldProps: Record<string, any>;
  /** 字段状态（含错误态覆盖）。 */
  resolvedStatus: any;
  /** 是否在 blur 时触发校验。 */
  validateOnBlur: boolean;
  /** 是否在 change 时触发校验。 */
  validateOnChange: boolean;
  /** 是否在 input 时触发校验。 */
  validateOnInput: boolean;
  /** 是否在 model 更新时触发校验。 */
  validateOnModelUpdate: boolean;
}

/**
 * 解析字段运行时上下文，统一处理值、校验触发策略和状态信息。
 * @param input 字段值、字段配置及运行时属性。
 * @returns 字段运行时上下文。
 */
export function resolveFieldRuntimeContext(input: {
  /** 当前字段错误信息。 */
  error?: any;
  /** 字段配置。 */
  field: RenderFieldItem;
  /** 框架默认 model 属性名。 */
  frameworkDefaultModelPropName: string;
  /** 当前字段值。 */
  modelValue: any;
  /** 运行时解析出的 model 属性名。 */
  resolvedModelPropName?: string;
  /** 表单运行时透传属性。 */
  runtimeProps?: Record<string, any>;
}): ResolvedFieldRuntimeContext {
  const commonConfig = input.runtimeProps?.commonConfig ?? {};
  const fieldModelPropName =
    input.field.modelPropName ||
    commonConfig.modelPropName ||
    input.resolvedModelPropName ||
    input.frameworkDefaultModelPropName;
  const emptyStateValue =
    input.field.emptyStateValue !== undefined
      ? input.field.emptyStateValue
      : commonConfig.emptyStateValue;
  const displayModelValue =
    input.modelValue === undefined ? emptyStateValue : input.modelValue;
  const formFieldProps = {
    ...(commonConfig.formFieldProps ?? {}),
    ...(input.field.formFieldProps ?? {}),
  };
  const validateOnModelUpdate = !!formFieldProps.validateOnModelUpdate;
  const validateOnChange =
    formFieldProps.validateOnChange ?? validateOnModelUpdate;
  const validateOnInput =
    formFieldProps.validateOnInput ?? validateOnModelUpdate;
  const validateOnBlur = !!formFieldProps.validateOnBlur;
  const rawFieldProps = (input.field.componentProps as Record<string, any>) ?? {};
  const disabled =
    !!input.field.disabled ||
    input.field.runtime.isDisabled ||
    !!rawFieldProps?.disabled;
  const configuredStatus = rawFieldProps?.status;
  const resolvedStatus = input.error ? 'error' : configuredStatus;
  const hideLabel = input.field.hideLabel ?? commonConfig.hideLabel;
  const hideRequiredMark =
    input.field.hideRequiredMark ?? commonConfig.hideRequiredMark;
  const requiredMarkFollowTheme = !!(
    input.field.requiredMarkFollowTheme ??
    commonConfig.requiredMarkFollowTheme ??
    false
  );
  const labelAlign =
    (input.field.labelAlign ?? commonConfig.labelAlign) === 'left'
      ? 'left'
      : 'right';
  const labelWidth = input.field.labelWidth ?? commonConfig.labelWidth ?? 100;

  return {
    commonConfig,
    disabled,
    displayModelValue,
    fieldModelPropName,
    hideLabel,
    hideRequiredMark,
    requiredMarkFollowTheme,
    labelAlign,
    labelWidth,
    rawFieldProps,
    resolvedStatus,
    validateOnBlur,
    validateOnChange,
    validateOnInput,
    validateOnModelUpdate,
  };
}

/**
 * 构建字段组件基础 props（含状态属性和 model 绑定）。
 * @param input 字段渲染上下文。
 * @returns 组件基础 props。
 */
export function buildFieldComponentBaseProps(input: {
  /** 是否禁用。 */
  disabled: boolean;
  /** 展示态字段值。 */
  displayModelValue: any;
  /** 字段基础配置。 */
  field: Pick<RenderFieldItem, 'commonComponentProps' | 'fieldName'>;
  /** 组件值属性名。 */
  modelPropName: string;
  /** 字段原始组件属性。 */
  rawFieldProps: Record<string, any>;
  /** 字段状态。 */
  resolvedStatus?: any;
}) {
  return {
    ...(input.field.commonComponentProps ?? {}),
    ...input.rawFieldProps,
    disabled: input.disabled,
    ...buildComponentStateAttrs(input.resolvedStatus),
    name: input.rawFieldProps?.name ?? input.field.fieldName,
    [input.modelPropName]: input.displayModelValue,
  } as Record<string, any>;
}
