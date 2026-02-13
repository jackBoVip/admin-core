
import {
  createFormAdapterBridge,
} from '@admin-core/form-core';
import { nativeReactComponents } from './components/native-components';
import type {
  ReactAdapterInput,
  RegisterReactFormComponentsOptions,
  SetupAdminFormReactOptions,
} from './types';
import type { ComponentType } from 'react';

const bridge = createFormAdapterBridge<ComponentType<any>, ReactAdapterInput>({
  activeLibrary: 'auto',
  defaultBaseModelPropName: 'value',
  nativeComponents: nativeReactComponents,
});

export function setupAdminFormReact(options: SetupAdminFormReactOptions = {}) {
  bridge.setup(options);
}

export const setupAdminForm = setupAdminFormReact;

export function registerFormComponents(
  components: ReactAdapterInput['components'],
  options: RegisterReactFormComponentsOptions = {}
) {
  bridge.register(components, options);
}

export function getReactFormAdapterRegistry() {
  return bridge.registry;
}

export const getFormAdapterRegistry = getReactFormAdapterRegistry;
