/**
 * Form Core 默认配置常量。
 * @description 定义表单 API 初始化时的默认属性与运行时字段状态。
 */
import type { AdminFormProps, RuntimeFieldState } from '../types';

/**
 * 运行时字段状态默认值。
 * 用于初始化每个字段的动态状态，避免在渲染期出现未定义访问。
 */
export const DEFAULT_RUNTIME_FIELD_STATE: RuntimeFieldState = {
  /** 组件级动态属性。 */
  dynamicComponentProps: {},
  /** 字段包装层动态属性。 */
  dynamicFieldComponentProps: {},
  /** 动态校验规则。 */
  dynamicRules: undefined,
  /** 是否正在计算依赖表达式。 */
  evaluating: false,
  /** 字段是否禁用。 */
  isDisabled: false,
  /** `if` 条件是否命中。 */
  isIf: true,
  /** 字段是否为必填。 */
  isRequired: false,
  /** 字段是否显示。 */
  isShow: true,
};

/**
 * 创建表单默认 props。
 * @returns 默认表单配置对象。
 */
export function createDefaultFormProps(): AdminFormProps {
  return {
    /** 操作按钮顺序是否反转。 */
    actionButtonsReverse: false,
    /** 操作区布局模式。 */
    actionLayout: 'rowEnd',
    /** 操作区在表单中的位置。 */
    actionPosition: 'right',
    /** 操作区容器 class。 */
    actionWrapperClass: '',
    /** 需要数组转字符串提交的字段映射。 */
    arrayToStringFields: undefined,
    /** 是否折叠。 */
    collapsed: false,
    /** 折叠后保留的行数。 */
    collapsedRows: 1,
    /** 折叠切换时是否触发重算。 */
    collapseTriggerResize: false,
    /** 通用组件配置。 */
    commonConfig: {},
    /** 是否使用紧凑间距。 */
    compact: false,
    /** 时间字段映射规则。 */
    fieldMappingTime: undefined,
    /** 网格列数。 */
    gridColumns: 1,
    /** 折叠状态变化回调。 */
    handleCollapsedChange: undefined,
    /** 重置回调。 */
    handleReset: undefined,
    /** 提交回调。 */
    handleSubmit: undefined,
    /** 值变化回调。 */
    handleValuesChange: undefined,
    /** 表单布局模式。 */
    layout: 'horizontal',
    /** 是否查询模式。 */
    queryMode: false,
    /** 重置按钮配置。 */
    resetButtonOptions: {},
    /** 字段 schema。 */
    schema: [],
    /** 提交失败后是否滚动到首个错误项。 */
    scrollToFirstError: false,
    /** 是否显示折叠按钮。 */
    showCollapseButton: false,
    /** 是否显示默认操作按钮。 */
    showDefaultActions: true,
    /** 提交按钮配置。 */
    submitButtonOptions: {},
    /** 值变化时是否自动提交。 */
    submitOnChange: false,
    /** 回车时是否自动提交。 */
    submitOnEnter: false,
    /** 最外层容器 class。 */
    wrapperClass: 'grid-cols-1',
  };
}
