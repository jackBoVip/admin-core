import {
  createFormAdapterBridge,
  type AdapterLibraryInput,
  type FormAdapterBridge,
  type RegisterFormAdapterComponentsOptions,
  type SemanticFormComponentType,
  type SetupFormAdaptersOptions,
} from '@admin-core/form-core';

type AdapterComponents<TComponent> = Partial<
  Record<SemanticFormComponentType, TComponent>
>;

type Maybe<TValue> = TValue | undefined;

export interface FormAdapterRuntime<
  TComponent,
  TAdapterInput extends AdapterLibraryInput<TComponent>,
> {
  bridge: FormAdapterBridge<TComponent, TAdapterInput>;
  register: (
    components: AdapterComponents<TComponent>,
    options?: RegisterFormAdapterComponentsOptions
  ) => void;
  setup: (options?: SetupFormAdaptersOptions<TComponent, TAdapterInput>) => void;
}

export function createFormAdapterRuntime<
  TComponent,
  TAdapterInput extends AdapterLibraryInput<TComponent>,
>(options: {
  defaultBaseModelPropName?: string;
  nativeComponents: AdapterComponents<TComponent>;
}): FormAdapterRuntime<TComponent, TAdapterInput> {
  const bridge = createFormAdapterBridge<TComponent, TAdapterInput>({
    activeLibrary: 'auto',
    ...(options.defaultBaseModelPropName
      ? { defaultBaseModelPropName: options.defaultBaseModelPropName }
      : {}),
    nativeComponents: options.nativeComponents,
  });

  return {
    bridge,
    setup(setupOptions: Maybe<SetupFormAdaptersOptions<TComponent, TAdapterInput>> = {}) {
      bridge.setup(setupOptions);
    },
    register(
      components: AdapterComponents<TComponent>,
      registerOptions: Maybe<RegisterFormAdapterComponentsOptions> = {}
    ) {
      bridge.register(components, registerOptions);
    },
  };
}
