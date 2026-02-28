import { createFormAdapterRuntime } from '@admin-core/form-shared';
import { nativeReactComponents } from './components/native-components';
import type {
  ReactAdapterInput,
  RegisterReactFormComponentsOptions,
  SetupAdminFormReactOptions,
} from './types';
import type { ComponentType } from 'react';

const runtime = createFormAdapterRuntime<ComponentType<any>, ReactAdapterInput>({
  defaultBaseModelPropName: 'value',
  nativeComponents: nativeReactComponents,
});
const bridge = runtime.bridge;

export function setupAdminFormReact(options: SetupAdminFormReactOptions = {}) {
  runtime.setup(options);
}

export const setupAdminForm = setupAdminFormReact;

export function registerFormComponents(
  components: ReactAdapterInput['components'],
  options: RegisterReactFormComponentsOptions = {}
) {
  runtime.register(components, options);
}

export function getReactFormAdapterRegistry() {
  return bridge.registry;
}

export const getFormAdapterRegistry = getReactFormAdapterRegistry;
