/**
 * @admin-core/tabs-react
 * React tabs adapter for @admin-core/tabs-core
 */

import './styles/index.css';

export * from '@admin-core/tabs-shared';

export { AdminTabs } from './components/AdminTabs';
export { getAdminTabsReactSetupState, setupAdminTabsReact } from './setup';

export type {
  AdminTabReactComponent,
  AdminTabReactItem,
  AdminTabsChangePayload,
  AdminTabsClosePayload,
  AdminTabsReactProps,
  SetupAdminTabsReactOptions,
} from './types';
