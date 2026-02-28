import { setupAdminFormReact } from '@admin-core/form-react';
import type { SetupAdminFormReactOptions } from '@admin-core/form-react';
import {
  createPageAdapterSetupRuntime,
} from '@admin-core/page-shared';
import { setupAdminTableReact } from '@admin-core/table-react';
import type { SetupAdminTableReactOptions } from '@admin-core/table-react';

import type { SetupAdminPageReactOptions } from './types';

const setupRuntime = createPageAdapterSetupRuntime<
  SetupAdminFormReactOptions,
  SetupAdminTableReactOptions
>({
  setupForm: setupAdminFormReact,
  setupTable: setupAdminTableReact,
});

export function setupAdminPageReact(options: SetupAdminPageReactOptions = {}) {
  setupRuntime.setup(options);
}

export function getAdminPageReactSetupState() {
  return setupRuntime.getSetupState();
}
