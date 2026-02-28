import { setupAdminFormVue } from '@admin-core/form-vue';
import type { SetupAdminFormVueOptions } from '@admin-core/form-vue';
import {
  createPageAdapterSetupRuntime,
} from '@admin-core/page-shared';
import { setupAdminTableVue } from '@admin-core/table-vue';
import type { SetupAdminTableVueOptions } from '@admin-core/table-vue';

import type { SetupAdminPageVueOptions } from './types';

const setupRuntime = createPageAdapterSetupRuntime<
  SetupAdminFormVueOptions,
  SetupAdminTableVueOptions
>({
  setupForm: setupAdminFormVue,
  setupTable: setupAdminTableVue,
});

export function setupAdminPageVue(options: SetupAdminPageVueOptions = {}) {
  setupRuntime.setup(options);
}

export function getAdminPageVueSetupState() {
  return setupRuntime.getSetupState();
}
