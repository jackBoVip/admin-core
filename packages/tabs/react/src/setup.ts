import {
  setupAdminTabsCore,
  type SetupAdminTabsCoreOptions,
} from '@admin-core/tabs-core';

import type {
  AdminTabsReactProps,
  SetupAdminTabsReactOptions,
} from './types';

interface AdminTabsReactSetupState {
  core: SetupAdminTabsCoreOptions;
  defaults: Partial<
    Pick<AdminTabsReactProps, 'closeAriaLabel' | 'defaultActiveKey' | 'tabs'>
  >;
  initialized: boolean;
}

const setupState: AdminTabsReactSetupState = {
  core: {},
  defaults: {},
  initialized: false,
};

export function setupAdminTabsReact(
  options: SetupAdminTabsReactOptions = {}
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

export function getAdminTabsReactSetupState() {
  return setupState;
}
