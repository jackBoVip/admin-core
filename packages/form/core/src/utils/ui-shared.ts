import { isString } from './guards';
import type {
  AdminFormApi,
  FormAdapterRegistry,
  RenderFieldItem,
  ResolvedComponentBinding,
} from '../types';


export function normalizeEventValue(eventOrValue: any, modelPropName: string) {
  if (eventOrValue && typeof eventOrValue === 'object' && 'target' in eventOrValue) {
    const target = (eventOrValue as { target?: Record<string, any> }).target;
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

export function getFieldComponentKey(field: Pick<RenderFieldItem, 'component'>) {
  return isString(field.component) ? field.component : 'input';
}

export function renderTextContent(content: any) {
  if (!content) return null;
  if (typeof content === 'function') return content();
  return content;
}

export function buildActionClass(input: {
  actionLayout?: 'inline' | 'newLine' | 'rowEnd';
  actionPosition?: 'center' | 'left' | 'right';
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

export interface FormActionMessages {
  collapse: string;
  expand: string;
  reset: string;
  submit: string;
}

export interface FormActionButtonPlan {
  key: 'reset' | 'submit';
  label: any;
  options: ReturnType<typeof normalizeButtonOptions>;
  variant: 'default' | 'primary';
}

export interface FormActionPlan {
  buttons: FormActionButtonPlan[];
  collapse: null | {
    key: 'collapse';
    label: string;
  };
}

export type FormActionRenderItem =
  | {
      actionKey: 'reset' | 'submit';
      afterSlot: null;
      beforeSlot: 'reset-before' | 'submit-before';
      kind: 'button';
      label: any;
      options: ReturnType<typeof normalizeButtonOptions>;
      variant: 'default' | 'primary';
    }
  | {
      actionKey: 'collapse';
      afterSlot: 'expand-after';
      beforeSlot: 'expand-before';
      kind: 'collapse';
      label: string;
    };

export interface FormActionHandlers {
  onCollapse: () => void | Promise<void>;
  onReset: () => void | Promise<void>;
  onSubmit: () => void | Promise<void>;
}

export function resolveFormActionPlan(input: {
  actionButtonsReverse?: boolean;
  collapsed?: boolean;
  messages: FormActionMessages;
  resetButtonOptions?: Record<string, any>;
  showCollapseButton?: boolean;
  showDefaultActions?: boolean;
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

export function buildFormActionButtonClass(input: {
  className?: string;
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

export async function handleFormActionItemClick(
  item: FormActionRenderItem,
  event: {
    defaultPrevented?: boolean;
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

export function resolveRenderedComponentContent(input: {
  api: AdminFormApi;
  field: Pick<RenderFieldItem, 'renderComponentContent'>;
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

export function createResolvedBindingCacheKey(input: {
  activeLibrary: string;
  componentKey: string;
  fieldModelPropName?: string;
  globalModelPropName?: string;
}) {
  return [
    input.globalModelPropName ?? '',
    input.fieldModelPropName ?? '',
    input.activeLibrary,
    input.componentKey,
  ].join('|');
}

export function buildControlStateAttrs(resolvedStatus: any) {
  if (!resolvedStatus) {
    return {};
  }
  return {
    'data-admin-invalid': resolvedStatus === 'error' ? 'true' : undefined,
    'data-admin-status': resolvedStatus,
  };
}

export function buildComponentStateAttrs(resolvedStatus: any) {
  if (!resolvedStatus) {
    return {};
  }
  return {
    'aria-invalid': resolvedStatus === 'error',
    ...buildControlStateAttrs(resolvedStatus),
  };
}

export function isFieldHiddenByState(field: Pick<RenderFieldItem, 'hide' | 'runtime'>) {
  return !!field.hide || !field.runtime.isIf || !field.runtime.isShow;
}

export function resolveFieldComponentBinding<TComponent>(input: {
  cache: Map<string, ResolvedComponentBinding<TComponent> | null>;
  field: Pick<RenderFieldItem, 'component' | 'modelPropName'>;
  globalModelPropName?: string;
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

export interface ResolvedFieldRuntimeContext {
  commonConfig: Record<string, any>;
  disabled: boolean;
  displayModelValue: any;
  fieldModelPropName: string;
  hideLabel: boolean;
  hideRequiredMark: boolean;
  labelAlign: 'left' | 'right';
  labelWidth: number;
  rawFieldProps: Record<string, any>;
  resolvedStatus: any;
  validateOnBlur: boolean;
  validateOnChange: boolean;
  validateOnInput: boolean;
  validateOnModelUpdate: boolean;
}

export function resolveFieldRuntimeContext(input: {
  error?: any;
  field: RenderFieldItem;
  frameworkDefaultModelPropName: string;
  modelValue: any;
  resolvedModelPropName?: string;
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

export function buildFieldComponentBaseProps(input: {
  disabled: boolean;
  displayModelValue: any;
  field: Pick<RenderFieldItem, 'commonComponentProps' | 'fieldName'>;
  modelPropName: string;
  rawFieldProps: Record<string, any>;
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
