import type { Component } from 'vue';

import { createFormAdapterRuntime } from '@admin-core/form-shared';

import { nativeVueComponents } from './components/native-components';
import type {
  RegisterVueFormComponentsOptions,
  SetupAdminFormVueOptions,
  VueAdapterInput,
} from './types';

const runtime = createFormAdapterRuntime<Component, VueAdapterInput>({
  nativeComponents: nativeVueComponents,
});
const bridge = runtime.bridge;

export function setupAdminFormVue(options: SetupAdminFormVueOptions = {}) {
  runtime.setup(options);
}

export const setupAdminForm = setupAdminFormVue;

export function registerFormComponents(
  components: VueAdapterInput['components'],
  options: RegisterVueFormComponentsOptions = {}
) {
  runtime.register(components, options);
}

export function getVueFormAdapterRegistry() {
  return bridge.registry;
}

export const getFormAdapterRegistry = getVueFormAdapterRegistry;
