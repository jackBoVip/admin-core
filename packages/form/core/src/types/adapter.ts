/**
 * Form Core 适配器类型定义。
 * @description 定义语义组件映射、适配器能力与组件绑定解析模型。
 */
import type { AdminFormComponentType, SemanticFormComponentType } from './schema';

/**
 * 适配器能力声明。
 * @description 描述组件库在 form-core 语义层上的能力开关。
 */
export interface AdapterCapabilities {
  /** 是否支持异步选项。 */
  asyncOptions?: boolean;
  /** 是否支持自定义 model 属性。 */
  customModelProp?: boolean;
  /** 是否支持日期区间。 */
  dateRange?: boolean;
  /** 是否支持插槽。 */
  slots?: boolean;
  [key: string]: boolean | undefined;
}

/**
 * 组件库适配器 V1 结构。
 * @description 约束组件库在 form-core 语义层的最小实现协议，用于跨框架统一适配。
 * @template TComponent 组件实现类型。
 */
export interface FormAdapterV1<TComponent = unknown> {
  /** 默认 model 属性名。 */
  baseModelPropName?: string;
  /** 能力声明。 */
  capabilities: AdapterCapabilities;
  /** 语义组件映射。 */
  components: Partial<Record<SemanticFormComponentType, TComponent>>;
  /** 组件级 model 属性名映射。 */
  modelPropNameMap?: Partial<Record<SemanticFormComponentType, string>>;
  /** 组件库名称。 */
  name: string;
  /** 适配器协议版本。 */
  version: 1;
}

/**
 * 适配器库注册输入结构。
 * @description 用于业务侧简化注册参数，最终会被桥接层规范化为 `FormAdapterV1`。
 * @template TComponent 组件实现类型。
 */
export interface AdapterLibraryInput<TComponent = unknown> {
  /** 默认 model 属性名。 */
  baseModelPropName?: string;
  /** 能力声明。 */
  capabilities?: AdapterCapabilities;
  /** 语义组件映射。 */
  components: Partial<Record<SemanticFormComponentType, TComponent>>;
  /** 组件级 model 属性名映射。 */
  modelPropNameMap?: Partial<Record<SemanticFormComponentType, string>>;
}

/**
 * 批量安装适配器的选项。
 * @description 支持一次性注册多套组件库，并指定初始激活库。
 * @template TComponent 组件实现类型。
 * @template TAdapterInput 适配器输入结构类型。
 */
export interface SetupFormAdaptersOptions<
  TComponent = unknown,
  TAdapterInput extends AdapterLibraryInput<TComponent> = AdapterLibraryInput<TComponent>,
> {
  /** 要注册的适配器库集合。 */
  libraries?: Record<string, TAdapterInput>;
  /** 初始激活的适配器库。 */
  library?: 'auto' | string;
}

/**
 * 注册适配器组件时的附加配置。
 * @description 用于局部覆盖能力、model 映射与目标库归属。
 */
export interface RegisterFormAdapterComponentsOptions {
  /** 默认 model 属性名。 */
  baseModelPropName?: string;
  /** 能力声明。 */
  capabilities?: AdapterCapabilities;
  /** 目标库名。 */
  library?: string;
  /** 组件级 model 属性名映射。 */
  modelPropNameMap?: Partial<Record<SemanticFormComponentType, string>>;
}

/**
 * 组件解析后的绑定信息。
 * @description 记录最终命中的组件来源、能力与 model 配置，供渲染层消费。
 * @template TComponent 组件实现类型。
 */
export interface ResolvedComponentBinding<TComponent = unknown> {
  /** 适配器能力。 */
  capabilities: AdapterCapabilities;
  /** 最终组件实现。 */
  component: TComponent;
  /** 请求解析时的组件键名。 */
  key: AdminFormComponentType;
  /** 来源库名。 */
  library?: string;
  /** 最终 model 属性名。 */
  modelPropName: string;
  /** 绑定来源。 */
  source: 'explicit' | 'library' | 'native';
}

/**
 * 组件解析入参。
 * @description 支持显式组件优先、语义键回退与原生回退策略配置。
 * @template TComponent 组件实现类型。
 */
export interface ResolveComponentOptions<TComponent = unknown> {
  /** 显式传入的组件。 */
  explicitComponent?: AdminFormComponentType | TComponent;
  /** 解析失败时是否回退到原生组件。 */
  fallbackToNative?: boolean;
  /** 键名。 */
  key: AdminFormComponentType;
}

/**
 * 适配器注册中心接口。
 * @description 提供组件库注册、切换与组件解析能力，是运行时适配核心。
 * @template TComponent 组件实现类型。
 */
export interface FormAdapterRegistry<TComponent = unknown> {
  /** 获取当前激活的组件库名称。 */
  getActiveLibrary(): string | 'auto';
  /**
   * 按名称读取组件库。
   * @param name 组件库名称。
   * @returns 命中的组件库；未命中时返回 `undefined`。
   */
  getLibrary(name: string): FormAdapterV1<TComponent> | undefined;
  /** 列出已注册组件库名称。 */
  listLibraries(): string[];
  /**
   * 注册组件库。
   * @param name 组件库名称。
   * @param adapter 组件库适配器。
   */
  registerLibrary(name: string, adapter: FormAdapterV1<TComponent>): void;
  /**
   * 解析字段组件绑定结果。
   * @param options 组件解析入参。
   * @returns 组件绑定结果；无法解析时返回 `null`。
   */
  resolveComponent(
    options: ResolveComponentOptions<TComponent>
  ): ResolvedComponentBinding<TComponent> | null;
  /**
   * 设置当前激活组件库。
   * @param name 组件库名称或 `auto`。
   */
  setActiveLibrary(name: string | 'auto'): void;
  /**
   * 设置原生回退适配器。
   * @param adapter 原生适配器。
   */
  setNativeAdapter(adapter: FormAdapterV1<TComponent>): void;
}

/**
 * 适配器桥接接口，提供规范化、注册和初始化能力。
 * @template TComponent 组件实现类型。
 * @template TAdapterInput 适配器输入结构类型。
 */
export interface FormAdapterBridge<
  TComponent = unknown,
  TAdapterInput extends AdapterLibraryInput<TComponent> = AdapterLibraryInput<TComponent>,
> {
  /**
   * 规范化组件库输入为 V1 协议结构。
   * @param name 组件库名称。
   * @param input 组件库输入配置。
   * @returns 标准化后的 V1 适配器结构。
   */
  normalize(name: string, input: TAdapterInput): FormAdapterV1<TComponent>;
  /**
   * 注册一组语义组件映射。
   * @param components 语义组件映射。
   * @param options 注册附加选项。
   */
  register(
    components: Partial<Record<SemanticFormComponentType, TComponent>>,
    options?: RegisterFormAdapterComponentsOptions
  ): void;
  /** 适配器注册中心实例。 */
  registry: FormAdapterRegistry<TComponent>;
  /**
   * 批量初始化并注册适配器库。
   * @param options 初始化选项。
   * @returns 无返回值。
   */
  setup(options?: SetupFormAdaptersOptions<TComponent, TAdapterInput>): void;
}
