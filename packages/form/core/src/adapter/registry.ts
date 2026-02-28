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

const DEFAULT_CAPABILITIES: AdapterCapabilities = {
  asyncOptions: false,
  customModelProp: false,
  dateRange: false,
  slots: false,
};

const COMPONENT_CAPABILITY_REQUIREMENTS: Partial<
  Record<SemanticFormComponentType, keyof AdapterCapabilities>
> = {
  'date-range': 'dateRange',
};

function adapterSupportsKey<TComponent>(
  adapter: FormAdapterV1<TComponent>,
  key: string
) {
  const capabilityKey =
    COMPONENT_CAPABILITY_REQUIREMENTS[key as SemanticFormComponentType];
  if (!capabilityKey) return true;
  return !!adapter.capabilities?.[capabilityKey];
}

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

export function createFormAdapterRegistry<TComponent = unknown>(
  options?: {
    activeLibrary?: 'auto' | string;
    libraries?: Record<string, FormAdapterV1<TComponent>>;
    nativeAdapter?: FormAdapterV1<TComponent>;
  }
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
    getActiveLibrary() {
      return activeLibrary;
    },
    getLibrary(name: string) {
      return libraryMap.get(name);
    },
    listLibraries() {
      return [...libraryMap.keys()];
    },
    registerLibrary(name, adapter) {
      if (adapter.version !== 1) {
        logger.warn(
          `Unsupported form adapter protocol version: ${adapter.version}. Expected version: 1`
        );
      }
      libraryMap.set(name, adapter);
    },
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
    setActiveLibrary(name) {
      activeLibrary = name;
    },
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
          // 保持键存在可预测
          (nativeAdapter.components as Record<string, TComponent | undefined>)[key] ??=
            undefined;
        }
      }
    },
  };

  return api;
}

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

export function createFormAdapterBridge<
  TComponent = unknown,
  TAdapterInput extends AdapterLibraryInput<TComponent> = AdapterLibraryInput<TComponent>,
>(options: {
  activeLibrary?: 'auto' | string;
  defaultBaseModelPropName?: string;
  nativeAdapter?: FormAdapterV1<TComponent>;
  nativeComponents?: Partial<Record<SemanticFormComponentType, TComponent>>;
}): FormAdapterBridge<TComponent, TAdapterInput> {
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
    normalize(name, input) {
      return normalizeAdapterInput(
        name,
        input as AdapterLibraryInput<TComponent>,
        options.defaultBaseModelPropName
      );
    },
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
