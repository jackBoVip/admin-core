/**
 * Form Core 适配器注册中心。
 * @description 维护语义组件到具体组件的映射与适配库优先级解析逻辑。
 */
import {
  COMPONENT_EVENT_PROP_OVERRIDES,
  DEFAULT_MODEL_PROP_NAME,
  SEMANTIC_COMPONENT_KEYS,
} from '../constants';
import { isString } from '../utils/guards';
import { logger } from '../utils/logger';
import type {
  AdapterLibraryInput,
  AdapterCapabilities,
  FormAdapterBridge,
  FormAdapterRegistry,
  FormAdapterV1,
  RegisterFormAdapterComponentsOptions,
  ResolveComponentOptions,
  ResolvedComponentBinding,
  SetupFormAdaptersOptions,
  SemanticFormComponentType,
} from '../types';

/** 适配器能力默认值。 */
const DEFAULT_CAPABILITIES: AdapterCapabilities = {
  asyncOptions: false,
  customModelProp: false,
  dateRange: false,
  slots: false,
};

/** 语义组件与能力标识的约束映射。 */
const COMPONENT_CAPABILITY_REQUIREMENTS: Partial<
  Record<SemanticFormComponentType, keyof AdapterCapabilities>
> = {
  'date-range': 'dateRange',
};

/**
 * 创建表单适配器注册中心的初始化配置。
 */
export interface CreateFormAdapterRegistryOptions<TComponent = unknown> {
  /** 初始激活库，`auto` 表示按注册顺序自动匹配。 */
  activeLibrary?: 'auto' | string;
  /** 预注册库集合。 */
  libraries?: Record<string, FormAdapterV1<TComponent>>;
  /** 原生适配器。 */
  nativeAdapter?: FormAdapterV1<TComponent>;
}

/**
 * 适配器桥接层初始化配置。
 */
export interface CreateFormAdapterBridgeOptions<TComponent = unknown> {
  /** 初始激活库。 */
  activeLibrary?: 'auto' | string;
  /** 默认 model 属性名。 */
  defaultBaseModelPropName?: string;
  /** 原生适配器。 */
  nativeAdapter?: FormAdapterV1<TComponent>;
  /** 原生组件映射。 */
  nativeComponents?: Partial<Record<SemanticFormComponentType, TComponent>>;
}

/**
 * 判断适配器是否支持指定语义组件。
 * @param adapter 适配器实例。
 * @param key 语义组件键。
 * @returns 是否支持。
 */
function adapterSupportsKey<TComponent>(
  adapter: FormAdapterV1<TComponent>,
  key: string
) {
  const capabilityKey =
    COMPONENT_CAPABILITY_REQUIREMENTS[key as SemanticFormComponentType];
  if (!capabilityKey) return true;
  return !!adapter.capabilities?.[capabilityKey];
}

/**
 * 创建原生适配器。
 * @param components 原生组件映射。
 * @returns 适配器对象。
 */
export function createNativeAdapter<TComponent = unknown>(
  components: Partial<Record<SemanticFormComponentType, TComponent>>
): FormAdapterV1<TComponent> {
  return {
    version: 1,
    name: 'native',
    components,
    modelPropNameMap: {},
    capabilities: {
      ...DEFAULT_CAPABILITIES,
      dateRange: true,
      slots: true,
    },
  };
}

/**
 * 解析组件 model 属性名。
 * @param adapter 适配器对象。
 * @param key 组件键。
 * @returns model 属性名。
 */
function normalizeModelPropName<TComponent>(
  adapter: FormAdapterV1<TComponent>,
  key: string
) {
  return (
    adapter.modelPropNameMap?.[key as SemanticFormComponentType] ||
    COMPONENT_EVENT_PROP_OVERRIDES[key as SemanticFormComponentType] ||
    adapter.baseModelPropName ||
    DEFAULT_MODEL_PROP_NAME
  );
}

/**
 * 构建统一的组件解析结果。
 * @param source 解析来源。
 * @param key 组件键。
 * @param component 组件实例。
 * @param adapter 适配器对象。
 * @param library 来源库名。
 * @returns 解析结果。
 */
function toResolvedBinding<TComponent>(
  source: ResolvedComponentBinding<TComponent>['source'],
  key: string,
  component: TComponent,
  adapter: FormAdapterV1<TComponent>,
  library?: string
): ResolvedComponentBinding<TComponent> {
  return {
    source,
    key,
    component,
    modelPropName: normalizeModelPropName(adapter, key),
    capabilities: {
      ...DEFAULT_CAPABILITIES,
      ...adapter.capabilities,
    },
    library,
  };
}

/**
 * 创建表单适配器注册中心。
 * @param options 注册中心初始化选项。
 * @returns 适配器注册中心实例。
 */
export function createFormAdapterRegistry<TComponent = unknown>(
  options?: CreateFormAdapterRegistryOptions<TComponent>
): FormAdapterRegistry<TComponent> {
  const libraryMap = new Map<string, FormAdapterV1<TComponent>>();
  let activeLibrary: 'auto' | string = options?.activeLibrary ?? 'auto';
  let nativeAdapter =
    options?.nativeAdapter ??
    createNativeAdapter<TComponent>({} as Partial<Record<SemanticFormComponentType, TComponent>>);

  if (options?.libraries) {
    for (const [name, adapter] of Object.entries(options.libraries)) {
      libraryMap.set(name, adapter);
    }
  }

  const api: FormAdapterRegistry<TComponent> = {
    /**
     * 获取当前激活适配器名称。
     * @returns 适配器名称或 `auto`。
     */
    getActiveLibrary() {
      return activeLibrary;
    },
    /**
     * 获取指定名称适配器。
     * @param name 适配器名称。
     * @returns 适配器实例。
     */
    getLibrary(name: string) {
      return libraryMap.get(name);
    },
    /**
     * 获取全部已注册适配器名称。
     * @returns 适配器名称数组。
     */
    listLibraries() {
      return [...libraryMap.keys()];
    },
    /**
     * 注册或覆盖适配器库。
     * @param name 适配器名称。
     * @param adapter 适配器实现。
     * @returns 无返回值。
     */
    registerLibrary(name, adapter) {
      if (adapter.version !== 1) {
        logger.warn(
          `Unsupported form adapter protocol version: ${adapter.version}. Expected version: 1`
        );
      }
      libraryMap.set(name, adapter);
    },
    /**
     * 解析字段组件绑定。
     * @param resolveOptions 解析参数。
     * @returns 组件绑定结果；未命中返回 `null`。
     */
    resolveComponent(resolveOptions: ResolveComponentOptions<TComponent>) {
      const { explicitComponent, key, fallbackToNative = true } = resolveOptions;

      if (explicitComponent && !isString(explicitComponent)) {
        return toResolvedBinding(
          'explicit',
          key,
          explicitComponent as TComponent,
          nativeAdapter
        );
      }

      if (isString(explicitComponent)) {
        const selected = libraryMap.get(explicitComponent);
        if (selected) {
          const candidate = selected.components[key as SemanticFormComponentType];
          if (candidate) {
            return toResolvedBinding('library', key, candidate, selected, explicitComponent);
          }
        }
      }

      /**
       * 从指定适配器尝试解析字段组件。
       * @param name 适配器名称。
       * @param adapter 适配器实例。
       * @returns 命中的组件绑定，未命中返回 `null`。
       */
      const tryFrom = (name: string, adapter: FormAdapterV1<TComponent>) => {
        const candidate = adapter.components[key as SemanticFormComponentType];
        if (!candidate) return null;
        if (!adapterSupportsKey(adapter, key)) {
          logger.warn({
            code: 'ADAPTER_CAPABILITY_UNSUPPORTED',
            key,
            library: name,
            requiredCapability:
              COMPONENT_CAPABILITY_REQUIREMENTS[key as SemanticFormComponentType],
          });
          return null;
        }
        return toResolvedBinding('library', key, candidate, adapter, name);
      };

      if (activeLibrary !== 'auto') {
        const selected = libraryMap.get(activeLibrary);
        if (!selected) {
          logger.warn(`Active form adapter library "${activeLibrary}" not found`);
        } else {
          const resolved = tryFrom(activeLibrary, selected);
          if (resolved) return resolved;
        }
      } else {
        for (const [name, adapter] of libraryMap.entries()) {
          const resolved = tryFrom(name, adapter);
          if (resolved) return resolved;
        }
      }

      if (!fallbackToNative) return null;

      const nativeCandidate = nativeAdapter.components[key as SemanticFormComponentType];
      if (!nativeCandidate) {
        logger.warn({
          code: 'COMPONENT_UNRESOLVED',
          key,
          message:
            'No form component resolved. Please register adapter mapping or native component.',
        });
        return null;
      }
      return toResolvedBinding('native', key, nativeCandidate, nativeAdapter, 'native');
    },
    /**
     * 设置当前激活适配器。
     * @param name 适配器名称。
     * @returns 无返回值。
     */
    setActiveLibrary(name) {
      activeLibrary = name;
    },
    /**
     * 更新原生适配器。
     * @param adapter 原生适配器配置。
     * @returns 无返回值。
     */
    setNativeAdapter(adapter) {
      nativeAdapter = {
        ...adapter,
        version: 1,
        name: adapter.name || 'native',
        capabilities: {
          ...DEFAULT_CAPABILITIES,
          ...adapter.capabilities,
        },
      };
      for (const key of SEMANTIC_COMPONENT_KEYS) {
        if (!nativeAdapter.components[key]) {
          /* 保持键存在可预测。 */
          (nativeAdapter.components as Record<string, TComponent | undefined>)[key] ??=
            undefined;
        }
      }
    },
  };

  return api;
}

/**
 * 规范化适配器输入配置。
 * @param name 适配器名称。
 * @param input 适配器输入。
 * @param defaultBaseModelPropName 默认 model 属性名。
 * @returns 标准化后的适配器对象。
 */
function normalizeAdapterInput<TComponent>(
  name: string,
  input: AdapterLibraryInput<TComponent>,
  defaultBaseModelPropName?: string
): FormAdapterV1<TComponent> {
  return {
    version: 1,
    name,
    capabilities: input.capabilities ?? {},
    components: input.components ?? {},
    baseModelPropName: input.baseModelPropName ?? defaultBaseModelPropName,
    modelPropNameMap: input.modelPropNameMap,
  };
}

/**
 * 创建适配器桥接层，统一提供 normalize/register/setup 能力。
 * @param options 桥接初始化配置。
 * @returns 适配器桥接实例。
 */
export function createFormAdapterBridge<
  TComponent = unknown,
  TAdapterInput extends AdapterLibraryInput<TComponent> = AdapterLibraryInput<TComponent>,
>(
  options: CreateFormAdapterBridgeOptions<TComponent>
): FormAdapterBridge<TComponent, TAdapterInput> {
  const nativeAdapter =
    options.nativeAdapter ??
    createNativeAdapter<TComponent>(
      options.nativeComponents ??
        ({} as Partial<Record<SemanticFormComponentType, TComponent>>)
    );
  const normalizedNativeAdapter = {
    ...nativeAdapter,
    baseModelPropName:
      nativeAdapter.baseModelPropName ?? options.defaultBaseModelPropName,
  };
  const registry = createFormAdapterRegistry<TComponent>({
    activeLibrary: options.activeLibrary ?? 'auto',
    nativeAdapter: normalizedNativeAdapter,
  });

  const bridge: FormAdapterBridge<TComponent, TAdapterInput> = {
    registry,
    /**
     * 规范化单个适配器配置。
     * @param name 适配器名称。
     * @param input 适配器输入配置。
     * @returns 规范化后的适配器。
     */
    normalize(name, input) {
      return normalizeAdapterInput(
        name,
        input as AdapterLibraryInput<TComponent>,
        options.defaultBaseModelPropName
      );
    },
    /**
     * 快速注册组件映射。
     * @param components 组件映射表。
     * @param registerOptions 注册选项。
     * @returns 无返回值。
     */
    register(
      components: Partial<Record<SemanticFormComponentType, TComponent>>,
      registerOptions: RegisterFormAdapterComponentsOptions = {}
    ) {
      const library = registerOptions.library ?? 'custom';
      registry.registerLibrary(
        library,
        normalizeAdapterInput(
          library,
          {
            components,
            capabilities: registerOptions.capabilities,
            baseModelPropName: registerOptions.baseModelPropName,
            modelPropNameMap: registerOptions.modelPropNameMap,
          },
          options.defaultBaseModelPropName
        )
      );
    },
    /**
     * 执行批量 setup。
     * @param setupOptions setup 选项。
     * @returns 无返回值。
     */
    setup(setupOptions: SetupFormAdaptersOptions<TComponent, TAdapterInput> = {}) {
      if (setupOptions.library) {
        registry.setActiveLibrary(setupOptions.library);
      }
      if (!setupOptions.libraries) {
        return;
      }
      for (const [name, adapter] of Object.entries(setupOptions.libraries)) {
        registry.registerLibrary(name, bridge.normalize(name, adapter));
      }
    },
  };

  return bridge;
}
