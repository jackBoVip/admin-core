/**
 * Form Core schema 类型定义。
 * @description 定义字段配置、规则模型、公共配置与提交上下文协议。
 */
import type { AdminFormApi } from './api';
import type { ZodTypeAny } from 'zod';

/**
 * 表单布局类型。
 * @description 定义表单项与标签在容器中的排列方式，影响默认间距与操作区布局。
 */
export type FormLayout = 'horizontal' | 'inline' | 'vertical';

/**
 * 语义化内置组件类型。
 * @description 用于跨框架适配层的统一组件语义键，避免直接绑定具体 UI 库组件名。
 */
export type SemanticFormComponentType =
  | 'checkbox'
  | 'checkbox-group'
  | 'date'
  | 'date-range'
  | 'default-button'
  | 'input'
  | 'password'
  | 'primary-button'
  | 'radio'
  | 'radio-group'
  | 'range'
  | 'section-title'
  | 'select'
  | 'switch'
  | 'textarea'
  | 'time';

/**
 * 表单组件类型，支持内置语义组件与自定义组件键。
 * @description 自定义字符串键可由适配器映射到对应框架组件，实现扩展组件接入。
 */
export type AdminFormComponentType =
  | SemanticFormComponentType
  | (Record<never, never> & string);

/**
 * 同步或异步返回值类型。
 * @template T 返回值类型。
 */
export type MaybeAsync<T> = Promise<T> | T;

/**
 * 依赖计算上下文。
 * @description 在动态显示、禁用、规则等依赖表达式执行时提供稳定的运行时信息。
 */
export interface FormDependencyContext {
  /** 当前字段名。 */
  fieldName: string;
  /** 用于中断异步任务的信号。 */
  signal: AbortSignal;
  /** 当前计算版本号。 */
  version: number;
}

/**
 * 表单提交上下文。
 * @description 在提交与重置回调中用于追踪当前请求生命周期，避免并发提交状态错乱。
 */
export interface FormSubmitContext {
  /** 用于中断异步提交的信号。 */
  signal: AbortSignal;
  /** 本次提交版本号。 */
  version: number;
}

/**
 * 校验规则执行上下文。
 * @description 提供当前字段与全量值信息，供自定义规则完成跨字段或异步校验。
 */
export interface FormRuleContext {
  /** 当前字段名。 */
  fieldName: string;
  /** 字段展示标签。 */
  label: string;
  /** 异步校验中断信号。 */
  signal?: AbortSignal;
  /** 当前完整表单值。 */
  values: Record<string, any>;
  /** 校验版本号。 */
  version?: number;
}

/**
 * 自定义校验器函数类型。
 * @description 返回 `true` 表示通过，返回字符串时将作为错误提示文案展示。
 */
export type FormRuleValidator = (
  value: any,
  params: any,
  context: FormRuleContext
) => MaybeAsync<boolean | string>;

/**
 * 字段规则配置类型。
 * @description 支持内置规则键、自定义函数、Zod Schema 及扩展规则名称。
 */
export type FormSchemaRuleType =
  | FormRuleValidator
  | 'required'
  | 'selectRequired'
  | ZodTypeAny
  | null
  | (Record<never, never> & string);

/**
 * 组件属性对象类型。
 * @description 透传给渲染组件的属性字典，键值由具体适配器解释。
 */
export type MaybeComponentProps = Record<string, any>;

/**
 * 动态组件属性计算函数类型。
 * @description 可基于当前表单值与 API 动态生成组件属性，实现联动配置。
 */
export type ComponentPropsGetter = (
  values: Record<string, any>,
  api: AdminFormApi,
  context?: FormDependencyContext
) => MaybeAsync<MaybeComponentProps>;

/**
 * 组件属性输入类型（静态对象或动态函数）。
 * @description 统一封装静态配置与运行时计算两种输入方式。
 */
export type ComponentPropsInput = ComponentPropsGetter | MaybeComponentProps;

/**
 * 字段校验触发时机配置。
 * @description 用于细粒度控制字段在不同交互阶段是否执行校验。
 */
export interface FormFieldOptions {
  /** 是否在失焦时校验。 */
  validateOnBlur?: boolean;
  /** 是否在变更时校验。 */
  validateOnChange?: boolean;
  /** 是否在输入时校验。 */
  validateOnInput?: boolean;
  /** 是否在模型更新时校验。 */
  validateOnModelUpdate?: boolean;
}

/**
 * 依赖表达式函数类型。
 * @template T 返回值类型。
 */
type FormDependencyPredicate<T> = (
  values: Record<string, any>,
  api: AdminFormApi,
  context?: FormDependencyContext
) => MaybeAsync<T>;

/**
 * 字段依赖配置。
 * @description 声明字段级动态行为，包括显示/禁用/规则/属性等联动能力。
 */
export interface AdminFormDependencies {
  /** 动态组件属性。 */
  componentProps?: FormDependencyPredicate<MaybeComponentProps>;
  /** 是否禁用。 */
  disabled?: boolean | FormDependencyPredicate<boolean>;
  /** 字段是否参与渲染。 */
  if?: boolean | FormDependencyPredicate<boolean>;
  /** 是否必填。 */
  required?: FormDependencyPredicate<boolean>;
  /** 动态规则。 */
  rules?: FormDependencyPredicate<FormSchemaRuleType>;
  /** 字段是否显示。 */
  show?: boolean | FormDependencyPredicate<boolean>;
  /** 依赖变化后的副作用。 */
  trigger?: FormDependencyPredicate<void>;
  /** 触发依赖重算的字段列表。 */
  triggerFields: string[];
}

/**
 * 表单/字段公共配置。
 * @description 可同时用于全局表单与单字段配置，字段级配置会覆盖同名全局项。
 */
export interface AdminFormCommonConfig {
  /** 标签后是否显示冒号。 */
  colon?: boolean;
  /** 全局组件属性。 */
  componentProps?: ComponentPropsInput;
  /** 控件容器类名。 */
  controlClass?: string;
  /** 是否禁用。 */
  disabled?: boolean;
  /** 禁用 change 监听器。 */
  disabledOnChangeListener?: boolean;
  /** 禁用 input 监听器。 */
  disabledOnInputListener?: boolean;
  /** 空值回显时的占位值。 */
  emptyStateValue?: null | undefined;
  /** 表单字段层属性。 */
  formFieldProps?: FormFieldOptions;
  /** 表单项类名。 */
  formItemClass?: (() => string) | string;
  /** 是否隐藏标签。 */
  hideLabel?: boolean;
  /** 是否隐藏必填标记。 */
  hideRequiredMark?: boolean;
  /** 必填标记是否跟随主题色。 */
  requiredMarkFollowTheme?: boolean;
  /** 标签对齐方式。 */
  labelAlign?: 'left' | 'right';
  /** 标签类名。 */
  labelClass?: string;
  /** 标签宽度。 */
  labelWidth?: number;
  /** 组件 model 属性名。 */
  modelPropName?: string;
  /** 外层容器类名。 */
  wrapperClass?: string;
}

/**
 * 文本/描述渲染类型。
 * @description 支持静态字符串或惰性函数，便于延迟读取国际化文案。
 */
export type CustomRenderType = string | (() => string);

/**
 * 单字段 Schema 定义。
 * @description 描述一个可渲染字段的组件、默认值、校验与依赖联动行为。
 */
export interface AdminFormSchema extends AdminFormCommonConfig {
  /** 字段渲染组件。 */
  component: AdminFormComponentType | any;
  /** 字段级组件属性。 */
  componentProps?: ComponentPropsInput;
  /** 默认值。 */
  defaultValue?: any;
  /** 字段依赖配置。 */
  dependencies?: AdminFormDependencies;
  /** 字段描述。 */
  description?: CustomRenderType;
  /** 字段名。 */
  fieldName: string;
  /** 字段级校验触发策略。 */
  formFieldProps?: FormFieldOptions;
  /** 帮助提示内容。 */
  help?: CustomRenderType;
  /** 是否隐藏字段。 */
  hide?: boolean;
  /** 展示标签。 */
  label?: CustomRenderType;
  /** 动态插槽内容渲染器。 */
  renderComponentContent?: (
    values: Record<string, any>,
    api: AdminFormApi
  ) => Record<string, any>;
  /** 校验规则。 */
  rules?: FormSchemaRuleType;
  /** 字段后缀内容。 */
  suffix?: CustomRenderType;
}

/**
 * 时间字段映射规则：
 * 第 1 项为源字段名，第 2 项为目标字段名对，第 3 项为转换器或映射配置。
 * @description 主要用于时间范围值与后端接口字段之间的双向映射。
 */
export type FieldMappingTime = [
  string,
  [string, string],
  (
    | ((value: any, fieldName: string) => any)
    | [string, string]
    | null
    | string
  )?,
][];

/**
 * 数组转字符串字段配置。
 * @description 提交前将数组字段按约定转换为字符串，便于兼容后端参数格式。
 */
export type ArrayToStringFields = Array<
  | [string[], string?]
  | string
  | string[]
>;

/**
 * 操作按钮配置。
 * @description 统一定义提交/重置等操作按钮的显示与文案，同时允许透传扩展属性。
 */
export interface ActionButtonOptions {
  /** 透传给按钮渲染层的扩展配置。 */
  [key: string]: any;
  /** 按钮文案。 */
  content?: string;
  /** 是否显示按钮。 */
  show?: boolean;
}

/**
 * 表单组件完整 props 定义。
 * @description 汇总布局、联动、提交流程与按钮行为等运行配置，是核心渲染入参。
 */
export interface AdminFormProps extends Omit<AdminFormCommonConfig, 'componentProps'> {
  /** 是否反转默认按钮顺序。 */
  actionButtonsReverse?: boolean;
  /** 操作区布局。 */
  actionLayout?: 'inline' | 'newLine' | 'rowEnd';
  /** 操作区对齐位置。 */
  actionPosition?: 'center' | 'left' | 'right';
  /** 操作区容器类名。 */
  actionWrapperClass?: string;
  /** 数组转字符串字段配置。 */
  arrayToStringFields?: ArrayToStringFields;
  /** 当前是否折叠。 */
  collapsed?: boolean;
  /** 折叠时显示行数。 */
  collapsedRows?: number;
  /** 折叠切换后是否触发布局重算。 */
  collapseTriggerResize?: boolean;
  /** 字段公共配置。 */
  commonConfig?: AdminFormCommonConfig;
  /** 紧凑模式开关。 */
  compact?: boolean;
  /** 时间字段映射配置。 */
  fieldMappingTime?: FieldMappingTime;
  /** 折叠状态变化回调。 */
  handleCollapsedChange?: (collapsed: boolean) => void;
  /** 重置回调。 */
  handleReset?: (
    values: Record<string, any>,
    context?: FormSubmitContext
  ) => MaybeAsync<void>;
  /** 提交回调。 */
  handleSubmit?: (
    values: Record<string, any>,
    context?: FormSubmitContext
  ) => MaybeAsync<void>;
  /** 值变化回调。 */
  handleValuesChange?: (
    values: Record<string, any>,
    fieldsChanged: string[]
  ) => void;
  /** 栅格列数。 */
  gridColumns?: number;
  /** 表单布局。 */
  layout?: FormLayout;
  /** 是否查询模式。 */
  queryMode?: boolean;
  /** 重置按钮配置。 */
  resetButtonOptions?: ActionButtonOptions;
  /** 表单 schema。 */
  schema?: AdminFormSchema[];
  /** 校验失败时是否滚动到首个错误项。 */
  scrollToFirstError?: boolean;
  /** 是否显示折叠按钮。 */
  showCollapseButton?: boolean;
  /** 是否显示默认操作按钮。 */
  showDefaultActions?: boolean;
  /** 提交按钮配置。 */
  submitButtonOptions?: ActionButtonOptions;
  /** 值变化后是否自动提交。 */
  submitOnChange?: boolean;
  /** 按回车是否提交。 */
  submitOnEnter?: boolean;
  /** 强制可见字段名列表。 */
  visibleFieldNames?: string[];
  /** 表单外层类名。 */
  wrapperClass?: string;
}

/**
 * 字段运行时状态。
 * @description 记录依赖求值后的最终状态，驱动字段渲染、禁用与必填标识展示。
 */
export interface RuntimeFieldState {
  /** 动态组件属性。 */
  dynamicComponentProps: MaybeComponentProps;
  /** 动态表单项属性。 */
  dynamicFieldComponentProps: MaybeComponentProps;
  /** 动态规则。 */
  dynamicRules?: FormSchemaRuleType;
  /** 是否正在计算依赖。 */
  evaluating: boolean;
  /** 是否禁用。 */
  isDisabled: boolean;
  /** 条件 `if` 结果。 */
  isIf: boolean;
  /** 是否必填。 */
  isRequired: boolean;
  /** 是否展示。 */
  isShow: boolean;
}
