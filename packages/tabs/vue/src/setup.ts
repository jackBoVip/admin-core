import {
  createAdminTabsAdapterSetupRuntime,
} from '@admin-core/tabs-shared';

import type {
  AdminTabsVueProps,
  SetupAdminTabsVueOptions,
} from './types';

const setupRuntime = createAdminTabsAdapterSetupRuntime<
  AdminTabsVueProps,
  SetupAdminTabsVueOptions
>();

export function setupAdminTabsVue(
  options: SetupAdminTabsVueOptions = {}
) {
  return setupRuntime.setup(options);
}

export function getAdminTabsVueSetupState() {
  return setupRuntime.getSetupState();
}
