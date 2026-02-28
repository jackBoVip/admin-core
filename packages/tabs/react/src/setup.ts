import {
  createAdminTabsAdapterSetupRuntime,
} from '@admin-core/tabs-shared';

import type {
  AdminTabsReactProps,
  SetupAdminTabsReactOptions,
} from './types';

const setupRuntime = createAdminTabsAdapterSetupRuntime<
  AdminTabsReactProps,
  SetupAdminTabsReactOptions
>();

export function setupAdminTabsReact(
  options: SetupAdminTabsReactOptions = {}
) {
  return setupRuntime.setup(options);
}

export function getAdminTabsReactSetupState() {
  return setupRuntime.getSetupState();
}
