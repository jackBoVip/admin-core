import type { AdminFormComponentType, SemanticFormComponentType } from './schema';

export interface AdapterCapabilities {
  asyncOptions?: boolean;
  customModelProp?: boolean;
  dateRange?: boolean;
  slots?: boolean;
  [key: string]: boolean | undefined;
}

export interface FormAdapterV1<TComponent = unknown> {
  baseModelPropName?: string;
  capabilities: AdapterCapabilities;
  components: Partial<Record<SemanticFormComponentType, TComponent>>;
  modelPropNameMap?: Partial<Record<SemanticFormComponentType, string>>;
  name: string;
  version: 1;
}

export interface AdapterLibraryInput<TComponent = unknown> {
  baseModelPropName?: string;
  capabilities?: AdapterCapabilities;
  components: Partial<Record<SemanticFormComponentType, TComponent>>;
  modelPropNameMap?: Partial<Record<SemanticFormComponentType, string>>;
}

export interface SetupFormAdaptersOptions<
  TComponent = unknown,
  TAdapterInput extends AdapterLibraryInput<TComponent> = AdapterLibraryInput<TComponent>,
> {
  libraries?: Record<string, TAdapterInput>;
  library?: 'auto' | string;
}

export interface RegisterFormAdapterComponentsOptions {
  baseModelPropName?: string;
  capabilities?: AdapterCapabilities;
  library?: string;
  modelPropNameMap?: Partial<Record<SemanticFormComponentType, string>>;
}

export interface ResolvedComponentBinding<TComponent = unknown> {
  capabilities: AdapterCapabilities;
  component: TComponent;
  key: AdminFormComponentType;
  library?: string;
  modelPropName: string;
  source: 'explicit' | 'library' | 'native';
}

export interface ResolveComponentOptions<TComponent = unknown> {
  explicitComponent?: AdminFormComponentType | TComponent;
  fallbackToNative?: boolean;
  key: AdminFormComponentType;
}

export interface FormAdapterRegistry<TComponent = unknown> {
  getActiveLibrary(): string | 'auto';
  getLibrary(name: string): FormAdapterV1<TComponent> | undefined;
  listLibraries(): string[];
  registerLibrary(name: string, adapter: FormAdapterV1<TComponent>): void;
  resolveComponent(
    options: ResolveComponentOptions<TComponent>
  ): ResolvedComponentBinding<TComponent> | null;
  setActiveLibrary(name: string | 'auto'): void;
  setNativeAdapter(adapter: FormAdapterV1<TComponent>): void;
}

export interface FormAdapterBridge<
  TComponent = unknown,
  TAdapterInput extends AdapterLibraryInput<TComponent> = AdapterLibraryInput<TComponent>,
> {
  normalize(name: string, input: TAdapterInput): FormAdapterV1<TComponent>;
  register(
    components: Partial<Record<SemanticFormComponentType, TComponent>>,
    options?: RegisterFormAdapterComponentsOptions
  ): void;
  registry: FormAdapterRegistry<TComponent>;
  setup(options?: SetupFormAdaptersOptions<TComponent, TAdapterInput>): void;
}
