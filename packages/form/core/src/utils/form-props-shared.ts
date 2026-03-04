/**
 * Form Core 属性同步工具。
 * @description 提供表单 props 变更检测、筛选与归并等共享处理逻辑。
 */
import { deepEqual } from './deep';

/**
 * 表单 props 同步跟踪器。
 */
export interface FormPropsSyncTracker {
  /**
   * 判断新 props 是否与上次快照存在差异。
   * @param next 下一次 props 快照。
   */
  hasChanges(next: Record<string, any>): boolean;
  /** 重置内部快照。 */
  reset(): void;
}

/**
 * 创建表单 props 同步跟踪器。
 * @returns 跟踪器实例。
 */
export function createFormPropsSyncTracker(): FormPropsSyncTracker {
  let previous: Record<string, any> | null = null;
  return {
    /**
     * 判断下一次 props 是否相较快照发生变化。
     * @param next 下一次 props 快照。
     * @returns 存在变化返回 `true`。
     */
    hasChanges(next: Record<string, any>) {
      if (previous && deepEqual(previous, next)) {
        return false;
      }
      previous = next;
      return true;
    },
    /**
     * 重置内部 props 快照。
     * @returns 无返回值。
     */
    reset() {
      previous = null;
    },
  };
}

/**
 * 按顺序合并多个 props 对象。
 * @param sources 待合并对象列表。
 * @returns 合并后的对象。
 */
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

/** 普通表单可提取的属性键集合。 */
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
  'requiredMarkFollowTheme',
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

/** 提交页可透传给内部表单及提交容器的属性键集合。 */
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

/**
 * 按键集合提取对象字段。
 * @param input 源对象。
 * @param keys 键集合。
 * @returns 提取后的对象。
 */
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

/**
 * 提取普通表单 props。
 * @param input 源对象。
 * @returns 表单 props 子集。
 */
export function pickFormProps(
  input: Record<string, any> | undefined | null
) {
  return pickByKeys(input, FORM_PROP_KEYS);
}

/**
 * 提取提交页表单 props。
 * @param input 源对象。
 * @returns 提交页 props 子集。
 */
export function pickSubmitPageProps(
  input: Record<string, any> | undefined | null
) {
  return pickByKeys(input, SUBMIT_PAGE_PROP_KEYS);
}

/**
 * 从对象中移除 `formApi` 字段。
 * @param input 源对象。
 * @returns 移除 `formApi` 后的对象。
 */
export function omitFormApiProp<T extends Record<string, any>>(
  input: T | undefined | null
): Omit<T, 'formApi'> {
  if (!input) {
    return {} as Omit<T, 'formApi'>;
  }
  const { formApi: _formApi, ...rest } = input as T & {
    /** 透传表单 API。 */
    formApi?: unknown;
  };
  return rest as Omit<T, 'formApi'>;
}
