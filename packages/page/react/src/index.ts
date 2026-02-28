/**
 * @admin-core/page-react
 * React page adapter for @admin-core/page-core
 */

import './styles/index.css';

export {
  createPageApi,
  getLocale,
  getLocaleMessages,
  getLocaleVersion,
  normalizePageLocale,
  normalizePageFormTableBridgeOptions,
  registerPageLocaleMessages,
  setLocale,
  setupAdminPageCore,
  subscribeLocaleChange,
  type AdminPageApi,
  type AdminPageItem,
  type AdminPageOptions,
  type ComponentPageItem,
  type NormalizedPageFormTableBridgeOptions,
  type PageFormTableBridgeContext,
  type PageFormTableBridgeOptions,
  type PageScrollOptions,
  type RoutePageItem,
} from '@admin-core/page-core';

export {
  AdminPage,
  AdminPageQueryTable,
  createAdminPageQueryTableApi,
} from './components';
export { useAdminPage } from './hooks';
export { useAdminPageQueryTable } from './hooks';
export { getAdminPageReactSetupState, setupAdminPageReact } from './setup';
export {
  createFormApi,
  setupAdminFormReact,
  type AdminFormApi,
  type AdminFormProps,
  type SetupAdminFormReactOptions,
} from '@admin-core/form-react';
export {
  createTableApi,
  setupAdminTableReact,
  type AdminTableApi,
  type AdminTableReactProps,
  type SetupAdminTableReactOptions,
} from '@admin-core/table-react';

export type {
  AdminPageQueryTableApi,
  AdminPageQueryTableReactProps,
  AdminPageReactItem,
  AdminPageReactProps,
  ExtendedAdminPageApi,
  ReactPageComponent,
  SetupAdminPageReactOptions,
  UseAdminPageQueryTableReturn,
} from './types';
