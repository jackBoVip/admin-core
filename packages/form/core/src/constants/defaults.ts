import type { AdminFormProps, RuntimeFieldState } from '../types';

export const DEFAULT_RUNTIME_FIELD_STATE: RuntimeFieldState = {
  dynamicComponentProps: {},
  dynamicFieldComponentProps: {},
  dynamicRules: undefined,
  evaluating: false,
  isDisabled: false,
  isIf: true,
  isRequired: false,
  isShow: true,
};

export function createDefaultFormProps(): AdminFormProps {
  return {
    actionButtonsReverse: false,
    actionLayout: 'rowEnd',
    actionPosition: 'right',
    actionWrapperClass: '',
    arrayToStringFields: undefined,
    collapsed: false,
    collapsedRows: 1,
    collapseTriggerResize: false,
    commonConfig: {},
    compact: false,
    fieldMappingTime: undefined,
    gridColumns: 1,
    handleCollapsedChange: undefined,
    handleReset: undefined,
    handleSubmit: undefined,
    handleValuesChange: undefined,
    layout: 'horizontal',
    queryMode: false,
    resetButtonOptions: {},
    schema: [],
    scrollToFirstError: false,
    showCollapseButton: false,
    showDefaultActions: true,
    submitButtonOptions: {},
    submitOnChange: false,
    submitOnEnter: false,
    wrapperClass: 'grid-cols-1',
  };
}
