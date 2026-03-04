/**
 * Form Shared 适配器运行时注册能力。
 * @description 封装 form-core 适配桥，提供跨框架统一的 setup/register 接口。
 */
import {
  createFormAdapterBridge,
  type AdapterLibraryInput,
  type FormAdapterBridge,
  type RegisterFormAdapterComponentsOptions,
  type SemanticFormComponentType,
  type SetupFormAdaptersOptions,
} from '@admin-core/form-core';

/**
 * 语义组件键到具体组件实现的映射。
 * @template TComponent 组件类型。
 */
type AdapterComponents<TComponent> = Partial<
  Record<SemanticFormComponentType, TComponent>
>;

/**
 * 可选值语义别名。
 * @template TValue 原始值类型。
 */
type Maybe<TValue> = TValue | undefined;

/**
 * 表单适配器运行时能力集合。
 * @template TComponent 组件类型。
 * @template TAdapterInput 适配器输入类型。
 */
export interface FormAdapterRuntime<
  TComponent,
  TAdapterInput extends AdapterLibraryInput<TComponent>,
> {
  /** 底层适配桥实例。 */
  bridge: FormAdapterBridge<TComponent, TAdapterInput>;
  /** 注册某个适配器库的组件映射。 */
  register: (
    components: AdapterComponents<TComponent>,
    options?: RegisterFormAdapterComponentsOptions
  ) => void;
  /** 设置适配器库列表与优先级。 */
  setup: (options?: SetupFormAdaptersOptions<TComponent, TAdapterInput>) => void;
}

/**
 * 创建表单适配器运行时所需参数。
 * @template TComponent 组件类型。
 */
export interface CreateFormAdapterRuntimeOptions<TComponent> {
  /** 默认基础 model 属性名（如 `value`、`modelValue`）。 */
  defaultBaseModelPropName?: string;
  /** 原生组件映射，作为兜底实现。 */
  nativeComponents: AdapterComponents<TComponent>;
}

/**
 * 创建表单适配器运行时。
 *
 * @template TComponent 组件类型。
 * @template TAdapterInput 适配器输入类型。
 * @param options 初始化配置。
 * @returns 适配器运行时对象，包含 `bridge/setup/register`。
 */
export function createFormAdapterRuntime<
  TComponent,
  TAdapterInput extends AdapterLibraryInput<TComponent>,
>(
  options: CreateFormAdapterRuntimeOptions<TComponent>
): FormAdapterRuntime<TComponent, TAdapterInput> {
  const bridge = createFormAdapterBridge<TComponent, TAdapterInput>({
    activeLibrary: 'auto',
    ...(options.defaultBaseModelPropName
      ? { defaultBaseModelPropName: options.defaultBaseModelPropName }
      : {}),
    nativeComponents: options.nativeComponents,
  });

  return {
    bridge,
    /**
     * 执行运行时适配器初始化。
     * @param setupOptions 初始化选项。
     * @returns 无返回值。
     */
    setup(setupOptions: Maybe<SetupFormAdaptersOptions<TComponent, TAdapterInput>> = {}) {
      bridge.setup(setupOptions);
    },
    /**
     * 注册一组语义组件映射。
     * @param components 语义组件映射。
     * @param registerOptions 注册选项。
     * @returns 无返回值。
     */
    register(
      components: AdapterComponents<TComponent>,
      registerOptions: Maybe<RegisterFormAdapterComponentsOptions> = {}
    ) {
      bridge.register(components, registerOptions);
    },
  };
}
