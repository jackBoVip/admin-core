import {
  setupAdminTabsCore,
  type SetupAdminTabsCoreOptions,
} from '@admin-core/tabs-core';

import type {
  AdminTabsVueProps,
  SetupAdminTabsVueOptions,
} from './types';

interface AdminTabsVueSetupState {
  core: SetupAdminTabsCoreOptions;
  defaults: Partial<
    Pick<AdminTabsVueProps, 'closeAriaLabel' | 'defaultActiveKey' | 'tabs'>
  >;
  initialized: boolean;
}

const setupState: AdminTabsVueSetupState = {
  core: {},
  defaults: {},
  initialized: false,
};

export function setupAdminTabsVue(
  options: SetupAdminTabsVueOptions = {}
) {
  setupAdminTabsCore(options);

  setupState.core = {
    ...setupState.core,
    ...options,
  };
  setupState.defaults = {
    ...setupState.defaults,
    ...(options.defaults ?? {}),
  };
  setupState.initialized = true;

  return setupState;
}

export function getAdminTabsVueSetupState() {
  return setupState;
}
