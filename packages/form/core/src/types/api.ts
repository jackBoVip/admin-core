/**
 * Form Core API 类型定义。
 * @description 定义表单快照、字段状态、API 接口与初始化参数结构。
 */
import type {
  AdminFormProps,
  AdminFormSchema,
  FormRuleValidator,
  FormSchemaRuleType,
  RuntimeFieldState,
} from './schema';
import type { LoggerMode, StoreApi } from '@admin-core/shared-core';

/**
 * 单字段校验结果。
 * @description 描述某个字段在一次校验流程后的通过状态与错误信息。
 */
export interface FieldValidationResult {
  /** 校验错误信息；通过时为空。 */
  error?: string;
  /** 是否校验通过。 */
  valid: boolean;
}

/**
 * 整体表单校验结果。
 * @description 汇总全字段校验状态，常用于提交前拦截与错误面板展示。
 */
export interface FormValidationResult {
  /** 字段错误映射。 */
  errors: Record<string, string>;
  /** 是否全部通过。 */
  valid: boolean;
  /** 当前表单值快照。 */
  values: Record<string, any>;
}

/**
 * 渲染层字段项定义。
 * @description 由 Schema 编译后得到的运行时字段结构，包含动态状态与合并属性。
 */
export interface RenderFieldItem extends AdminFormSchema {
  /** 合并后的公共组件属性。 */
  commonComponentProps: Record<string, any>;
  /** 是否因折叠策略而隐藏。 */
  hiddenByCollapse: boolean;
  /** 字段运行时状态。 */
  runtime: RuntimeFieldState;
  /** 最终规则配置。 */
  rules?: FormSchemaRuleType;
}

/**
 * 表单渲染状态。
 * @description 提供当前可见字段与折叠状态，供视图层渲染和布局计算使用。
 */
export interface FormRenderState {
  /** 当前是否折叠。 */
  collapsed: boolean;
  /** 可渲染字段列表。 */
  fields: RenderFieldItem[];
}

/**
 * 表单快照数据。
 * @description 用于状态存储与调试导出，记录当前值、错误、运行态与配置。
 */
export interface AdminFormSnapshot {
  /** 当前错误映射。 */
  errors: Record<string, string>;
  /** 最近一次成功提交值。 */
  latestSubmissionValues: Record<string, any> | null;
  /** 当前 props。 */
  props: AdminFormProps;
  /** 字段运行时状态映射。 */
  runtime: Record<string, RuntimeFieldState>;
  /** 当前表单值。 */
  values: Record<string, any>;
}

/**
 * 合并后的多表单 API。
 * @description 提供链式合并与批量提交能力。
 */
export type MergedAdminFormApi = AdminFormApi & {
  /**
   * 继续合并下一个表单 API。
   * @param nextFormApi 下一个表单 API。
   * @returns 继续可链式调用的合并 API。
   */
  merge(nextFormApi: AdminFormApi): MergedAdminFormApi;
  /**
   * 提交当前合并链中的所有表单。
   * @param needMerge 是否将多个表单结果合并为一个对象。
   * @returns 批量提交结果；按 `needMerge` 返回合并对象或数组。
   */
  submitAllForm(
    needMerge?: boolean
  ): Promise<Record<string, any> | Record<string, any>[] | undefined>;
};

/**
 * 表单 API 接口定义。
 * @description 统一封装字段读写、运行态管理、校验与提交流程，是表单核心控制入口。
 */
export interface AdminFormApi {
  /** 表单响应式状态。 */
  form: {
    /** 错误映射。 */
    errors: Record<string, string>;
    /** 表单值。 */
    values: Record<string, any>;
  };
  /**
   * 获取指定字段对应组件实例。
   * @param fieldName 字段名。
   * @returns 对应字段组件实例；不存在时返回 `undefined`。
   */
  getFieldComponentRef<T = unknown>(fieldName: string): T | undefined;
  /** 获取当前焦点字段名。 */
  getFocusedField(): string | undefined;
  /** 获取最近一次成功提交值。 */
  getLatestSubmissionValues(): Record<string, any>;
  /** 获取当前渲染状态。 */
  getRenderState(): FormRenderState;
  /** 获取当前快照。 */
  getSnapshot(): AdminFormSnapshot;
  /** 获取当前表单配置状态。 */
  getState(): AdminFormProps;
  /**
   * 获取当前表单值。
   * @returns 表单值对象。
   */
  getValues<T = Record<string, any>>(): Promise<T>;
  /**
   * 判断单字段是否通过校验。
   * @param fieldName 字段名。
   * @returns 是否通过校验。
   */
  isFieldValid(fieldName: string): Promise<boolean>;
  /**
   * 与另一个表单 API 合并，形成链式提交能力。
   * @param formApi 待合并表单 API。
   * @returns 合并后的多表单 API。
   */
  merge(formApi: AdminFormApi): MergedAdminFormApi;
  /** 标记挂载。 */
  mount(): void;
  /**
   * 注册字段组件实例引用。
   * @param fieldName 字段名。
   * @param ref 组件实例。
   */
  registerFieldComponentRef(fieldName: string, ref: unknown): void;
  /**
   * 删除字段组件实例引用。
   * @param fieldName 字段名。
   */
  removeFieldComponentRef(fieldName: string): void;
  /**
   * 按字段名删除 schema 项。
   * @param fields 待删除字段名列表。
   * @returns 无返回值。
   */
  removeSchemaByFields(fields: string[]): Promise<void>;
  /**
   * 重置表单。
   * @param values 可选重置覆盖值。
   * @returns 无返回值。
   */
  resetForm(values?: Partial<Record<string, any>>): Promise<void>;
  /** 重置全部校验状态。 */
  resetValidate(): Promise<void>;
  /**
   * 设置单字段值。
   * @param field 字段路径。
   * @param value 字段值。
   * @param shouldValidate 设置后是否立即校验。
   * @returns 无返回值。
   */
  setFieldValue(field: string, value: any, shouldValidate?: boolean): Promise<void>;
  /**
   * 设置最近一次提交值快照。
   * @param values 提交值快照。
   */
  setLatestSubmissionValues(values: null | Record<string, any>): void;
  /**
   * 合并更新表单配置。
   * @param stateOrFn 状态补丁或补丁工厂。
   */
  setState(
    stateOrFn:
      | ((prev: AdminFormProps) => Partial<AdminFormProps>)
      | Partial<AdminFormProps>
  ): void;
  /**
   * 批量设置字段值。
   * @param fields 字段值映射。
   * @param filterFields 是否仅保留 schema 中存在的字段。
   * @param shouldValidate 设置后是否校验受影响字段。
   */
  setValues(
    fields: Record<string, any>,
    filterFields?: boolean,
    shouldValidate?: boolean
  ): Promise<void>;
  /** 表单状态存储。 */
  store: StoreApi<AdminFormSnapshot>;
  /**
   * 执行表单提交。
   * @param event 原始事件对象。
   * @returns 提交结果对象。
   */
  submitForm(event?: Event): Promise<Record<string, any>>;
  /** 标记卸载并清理运行时资源。 */
  unmount(): void;
  /**
   * 更新 schema。
   * @param schema 增量 schema 配置。
   */
  updateSchema(schema: Partial<AdminFormSchema>[]): void;
  /** 执行全量校验。 */
  validate(): Promise<FormValidationResult>;
  /** 执行“先校验后提交”。 */
  validateAndSubmitForm(): Promise<Record<string, any> | undefined>;
  /**
   * 校验单字段。
   * @param fieldName 字段名。
   * @returns 单字段校验结果。
   */
  validateField(fieldName: string): Promise<FieldValidationResult>;
}

/**
 * 全局规则注册映射。
 * @description 以规则名为键、规则实现为值，用于扩展内置校验体系。
 */
export interface RegisterFormRulesOptions {
  [ruleName: string]: FormRuleValidator;
}

/**
 * 表单核心初始化选项。
 * @description 在全局 setup 阶段配置默认语言、日志与预注册规则。
 */
export interface SetupAdminFormCoreOptions {
  /** 默认语言。 */
  locale?: string;
  /** 日志级别。 */
  logLevel?: LoggerMode;
  /** 需要预注册的规则集合。 */
  rules?: RegisterFormRulesOptions;
}
