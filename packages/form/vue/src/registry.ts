import type { Component } from 'vue';

import {
  createFormAdapterBridge,
} from '@admin-core/form-core';

import { nativeVueComponents } from './components/native-components';
import type {
  RegisterVueFormComponentsOptions,
  SetupAdminFormVueOptions,
  VueAdapterInput,
} from './types';

const bridge = createFormAdapterBridge<Component, VueAdapterInput>({
  activeLibrary: 'auto',
  nativeComponents: nativeVueComponents,
});

export function setupAdminFormVue(options: SetupAdminFormVueOptions = {}) {
  bridge.setup(options);
}

export const setupAdminForm = setupAdminFormVue;

export function registerFormComponents(
  components: VueAdapterInput['components'],
  options: RegisterVueFormComponentsOptions = {}
) {
  bridge.register(components, options);
}

export function getVueFormAdapterRegistry() {
  return bridge.registry;
}

export const getFormAdapterRegistry = getVueFormAdapterRegistry;
