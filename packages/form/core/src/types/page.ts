/**
 * Form Core 提交页类型定义。
 * @description 定义提交页步骤模型、控制器协议与步骤切换事件载荷。
 */
import type { AdminFormApi } from './api';
import type {
  AdminFormProps,
  AdminFormSchema,
  FormSubmitContext,
  MaybeAsync,
} from './schema';

/**
 * 提交页容器展示模式。
 * @description 支持抽屉与弹窗两种承载形态，用于适配不同页面交互密度。
 */
export type AdminFormContainerMode = 'drawer' | 'modal';

/**
 * 抽屉模式侧边位置。
 * @description 当容器模式为 `drawer` 时生效。
 */
export type AdminFormDrawerPlacement = 'left' | 'right';

/**
 * 步骤流转方向。
 * @description 用于步骤切换事件与动画计算。
 */
export type AdminFormStepDirection = 'backward' | 'forward' | 'none';

/**
 * 步骤切换动画类型。
 * @description 控制步骤切换时的视觉过渡风格。
 */
export type AdminFormStepAnimation = 'fade' | 'slide';

/**
 * 表单步骤中的分组配置。
 * @description 用于在单个步骤内按业务块拆分字段展示。
 */
export interface AdminFormSectionSchema {
  /** 分组描述文案。 */
  description?: string;
  /** 分组唯一键。 */
  key?: string;
  /** 分组内字段 schema。 */
  schema: AdminFormSchema[];
  /** 分组标题文案。 */
  title?: string;
}

/**
 * 单个步骤配置。
 * @description 描述分步表单中的一个流程节点及其字段集合。
 */
export interface AdminFormStepSchema {
  /** 当前步骤列数配置。 */
  columns?: number;
  /** 步骤描述文案。 */
  description?: string;
  /** 步骤唯一键。 */
  key?: string;
  /** 步骤直接字段 schema。 */
  schema?: AdminFormSchema[];
  /** 步骤分组配置。 */
  sections?: AdminFormSectionSchema[];
  /** 步骤标题文案。 */
  title: string;
}

/**
 * 解析后的分组配置。
 * @description 在运行时补齐默认值后用于渲染与校验的标准分组结构。
 */
export interface ResolvedAdminFormSectionSchema extends AdminFormSectionSchema {
  /** 归一化后的列数。 */
  columns: number;
  /** 分组中所有字段名。 */
  fieldNames: string[];
  /** 归一化后的分组键。 */
  key: string;
  /** 归一化后的分组字段 schema。 */
  schema: AdminFormSchema[];
  /** 所属步骤索引。 */
  stepIndex: number;
}

/**
 * 解析后的步骤配置。
 * @description 在运行时补齐默认值后用于步骤导航与渲染的标准步骤结构。
 */
export interface ResolvedAdminFormStepSchema extends AdminFormStepSchema {
  /** 归一化后的列数。 */
  columns: number;
  /** 当前步骤全部字段名。 */
  fieldNames: string[];
  /** 归一化后的步骤键。 */
  key: string;
  /** 归一化后的步骤分组列表。 */
  sections: ResolvedAdminFormSectionSchema[];
}

/**
 * 构建分步表单 schema 的参数。
 * @description 控制分步 schema 编译过程中的布局与字段注入策略。
 */
export interface BuildSteppedFormSchemaOptions {
  /** 是否插入分组分割组件。 */
  includeSectionDivider?: boolean;
  /** 初始步骤索引。 */
  initialStep?: number;
  /** 行布局列数。 */
  rowColumns?: number;
  /** 分组标题组件名称。 */
  sectionComponent?: string;
  /** 当前步骤字段名。 */
  stepFieldName?: string;
}

/**
 * 构建分步表单 schema 的结果。
 * @description 输出可直接渲染的 schema 与步骤索引辅助数据。
 */
export interface BuildSteppedFormSchemaResult {
  /** 最终可渲染 schema。 */
  schema: AdminFormSchema[];
  /** 当前步骤字段名。 */
  stepFieldName: string;
  /** 归一化后的步骤列表。 */
  steps: ResolvedAdminFormStepSchema[];
}

/**
 * 字段校验结果。
 * @description 用于描述当前字段集合校验后的总体状态。
 */
export interface ValidateFormFieldsResult {
  /** 字段错误映射，键为字段名。 */
  errors: Record<string, string>;
  /** 是否全部校验通过。 */
  valid: boolean;
}

/**
 * 分步表单校验结果。
 * @description 在字段校验结果基础上补充首个不通过步骤信息。
 */
export interface ValidateSteppedFormResult extends ValidateFormFieldsResult {
  /** 第一个不通过的步骤索引。 */
  firstInvalidStep: number;
}

/**
 * 步骤切换事件载荷。
 * @description 记录步骤切换前后状态与方向，供 UI 与业务逻辑联动使用。
 */
export interface AdminFormStepChangePayload {
  /** 切换方向。 */
  direction: AdminFormStepDirection;
  /** 切换后的目标步骤索引。 */
  nextStep: number;
  /** 切换前的步骤索引。 */
  previousStep: number;
  /** 切换后的步骤配置。 */
  step: ResolvedAdminFormStepSchema;
}

/**
 * 分步提交上下文。
 * @description 在最终提交回调中用于识别当前步骤与 API 状态。
 */
export interface AdminFormSteppedSubmitContext extends FormSubmitContext {
  /** 当前步骤索引。 */
  activeStep: number;
  /** 表单 API。 */
  api: AdminFormApi;
}

/**
 * 分步提交处理器。
 * @description 返回 `false` 可阻止继续流转到下一步或最终提交。
 */
export type AdminFormSteppedSubmitHandler = (
  values: Record<string, any>,
  context: AdminFormSteppedSubmitContext
) => MaybeAsync<boolean | void>;

/**
 * 提交页执行 `next` 后的结果。
 * @description 区分“被阻止”“进入下一步”“已提交”三种状态。
 */
export type AdminFormSubmitPageNextResult =
  | {
      /** 当前状态标识。 */
      status: 'blocked';
    }
  | {
      /** 当前状态标识。 */
      status: 'moved';
      /** 移动后的步骤索引。 */
      nextStep: number;
    }
  | {
      /** 当前状态标识。 */
      status: 'submitted';
      /** 最终提交值。 */
      values: Record<string, any>;
    };

/**
 * 提交页控制器接口。
 * @description 对外暴露提交页的开关、步骤导航与提交触发能力，便于业务代码集中编排流程。
 */
export interface AdminFormSubmitPageController {
  /** 关闭提交页。 */
  close: () => void;
  /** 获取当前步骤索引。 */
  getStep: () => number;
  /** 获取总步骤数。 */
  getTotalSteps: () => number;
  /** 获取表单 API。 */
  getFormApi: () => AdminFormApi;
  /** 获取打开状态。 */
  getOpen: () => boolean;
  /**
   * 跳转到指定步骤。
   * @param step 目标步骤索引。
   * @returns 实际跳转后的步骤索引。
   */
  goToStep: (step: number) => Promise<number>;
  /**
   * 前进到下一步或触发提交。
   * @returns 下一步执行结果。
   */
  next: () => Promise<AdminFormSubmitPageNextResult>;
  /** 打开提交页。 */
  open: () => void;
  /**
   * 回到上一步。
   * @returns 是否成功回退。
   */
  prev: () => Promise<boolean>;
  /**
   * 设置打开状态。
   * @param open 目标打开状态。
   * @returns 无返回值。
   */
  setOpen: (open: boolean) => void;
  /**
   * 切换打开状态。
   * @param open 可选目标状态；未传时自动取反。
   * @returns 无返回值。
   */
  toggle: (open?: boolean) => void;
}

/**
 * 提交页基础 props。
 * @description 定义分步提交页容器、步骤行为与文案配置，供 React/Vue 适配层复用。
 */
export interface AdminFormSubmitPageBaseProps
  extends Omit<AdminFormProps, 'schema' | 'showDefaultActions'> {
  /** 步骤切换动画。 */
  animation?: AdminFormStepAnimation;
  /** 取消按钮文案。 */
  cancelText?: string;
  /** 页面描述文案。 */
  description?: string;
  /** 关闭后是否销毁内容。 */
  destroyOnClose?: boolean;
  /** 抽屉模式打开方向。 */
  drawerPlacement?: AdminFormDrawerPlacement;
  /** 初始步骤索引。 */
  initialStep?: number;
  /** 点击蒙层是否可关闭。 */
  maskClosable?: boolean;
  /** 容器模式。 */
  mode?: AdminFormContainerMode;
  /** 下一步按钮文案。 */
  nextText?: string;
  /** 点击取消按钮时触发。 */
  onCancel?: () => void;
  /** 打开状态变化时触发。 */
  onOpenChange?: (open: boolean) => void;
  /** 步骤变化时触发。 */
  onStepChange?: (payload: AdminFormStepChangePayload) => void;
  /** 最终提交回调。 */
  onSubmit?: AdminFormSteppedSubmitHandler;
  /** 是否打开。 */
  open: boolean;
  /** 上一步按钮文案。 */
  prevText?: string;
  /** 关闭时是否重置。 */
  resetOnClose?: boolean;
  /** 提交成功后是否重置。 */
  resetOnSubmit?: boolean;
  /** 行布局列数。 */
  rowColumns?: number;
  /** 是否显示步骤头部。 */
  showStepHeader?: boolean;
  /** 当前步骤字段名。 */
  stepFieldName?: string;
  /** 动画时长（毫秒）。 */
  stepDurationMs?: number;
  /** 步骤列表。 */
  steps: AdminFormStepSchema[];
  /** 提交按钮文案。 */
  submitText?: string;
  /** 标题文案。 */
  title?: string;
  /** 宽度。 */
  width?: number | string;
}
