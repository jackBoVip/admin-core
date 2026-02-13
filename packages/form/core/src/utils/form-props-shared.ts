import { deepEqual } from './deep';

export interface FormPropsSyncTracker {
  hasChanges(next: Record<string, any>): boolean;
  reset(): void;
}

export function createFormPropsSyncTracker(): FormPropsSyncTracker {
  let previous: Record<string, any> | null = null;
  return {
    hasChanges(next: Record<string, any>) {
      if (previous && deepEqual(previous, next)) {
        return false;
      }
      previous = next;
      return true;
    },
    reset() {
      previous = null;
    },
  };
}

export function mergeFormProps(
  ...sources: Array<Record<string, any> | undefined | null>
) {
  const merged: Record<string, any> = {};
  for (const source of sources) {
    if (!source) continue;
    Object.assign(merged, source);
  }
  return merged;
}

const FORM_PROP_KEYS = new Set<string>([
  'actionButtonsReverse',
  'actionLayout',
  'actionPosition',
  'actionWrapperClass',
  'arrayToStringFields',
  'collapsed',
  'collapsedRows',
  'collapseTriggerResize',
  'colon',
  'commonConfig',
  'compact',
  'controlClass',
  'disabled',
  'disabledOnChangeListener',
  'disabledOnInputListener',
  'emptyStateValue',
  'fieldMappingTime',
  'formFieldProps',
  'formItemClass',
  'gridColumns',
  'handleCollapsedChange',
  'handleReset',
  'handleSubmit',
  'handleValuesChange',
  'hideLabel',
  'hideRequiredMark',
  'labelAlign',
  'labelClass',
  'labelWidth',
  'layout',
  'queryMode',
  'modelPropName',
  'resetButtonOptions',
  'schema',
  'scrollToFirstError',
  'showCollapseButton',
  'showDefaultActions',
  'submitButtonOptions',
  'submitOnChange',
  'submitOnEnter',
  'visibleFieldNames',
  'wrapperClass',
]);

const SUBMIT_PAGE_PROP_KEYS = new Set<string>([
  ...FORM_PROP_KEYS,
  'animation',
  'cancelText',
  'description',
  'destroyOnClose',
  'drawerPlacement',
  'formApi',
  'initialStep',
  'maskClosable',
  'mode',
  'nextText',
  'onCancel',
  'onOpenChange',
  'onStepChange',
  'onSubmit',
  'open',
  'prevText',
  'resetOnClose',
  'resetOnSubmit',
  'rowColumns',
  'showStepHeader',
  'stepDurationMs',
  'stepFieldName',
  'steps',
  'submitText',
  'title',
  'width',
]);

function pickByKeys(
  input: Record<string, any> | undefined | null,
  keys: Set<string>
) {
  const output: Record<string, any> = {};
  if (!input || typeof input !== 'object') {
    return output;
  }
  for (const key of Object.keys(input)) {
    if (!keys.has(key)) continue;
    output[key] = input[key];
  }
  return output;
}

export function pickFormProps(
  input: Record<string, any> | undefined | null
) {
  return pickByKeys(input, FORM_PROP_KEYS);
}

export function pickSubmitPageProps(
  input: Record<string, any> | undefined | null
) {
  return pickByKeys(input, SUBMIT_PAGE_PROP_KEYS);
}

export function omitFormApiProp<T extends Record<string, any>>(
  input: T | undefined | null
): Omit<T, 'formApi'> {
  if (!input) {
    return {} as Omit<T, 'formApi'>;
  }
  const { formApi: _formApi, ...rest } = input as T & { formApi?: unknown };
  return rest as Omit<T, 'formApi'>;
}
