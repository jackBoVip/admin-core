/**
 * @admin-core/tabs-vue
 * Vue 3 tabs adapter for @admin-core/tabs-core
 */

import './styles/index.css';

export * from '@admin-core/tabs-shared';

export { AdminTabs } from './components/AdminTabs';
export { getAdminTabsVueSetupState, setupAdminTabsVue } from './setup';

export type {
  AdminTabVueItem,
  AdminTabsChangePayload,
  AdminTabsClosePayload,
  AdminTabsVueProps,
  SetupAdminTabsVueOptions,
} from './types';
