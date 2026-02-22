import type { SetupAdminTableReactOptions } from './types';

import {
  createTableDateFormatter,
  normalizeTableLocale,
  registerTableFormatters,
  setLocale as setTableLocale,
  setupAdminTableCore,
} from '@admin-core/table-core';
import { getDefaultPreferencesStore } from '@admin-core/preferences';

import { registerBuiltinReactRenderers } from './renderers';

const state: {
  accessCodes?: SetupAdminTableReactOptions['accessCodes'];
  accessRoles?: SetupAdminTableReactOptions['accessRoles'];
  defaultGridOptions: Record<string, any>;
  initialized: boolean;
  locale: 'en-US' | 'zh-CN';
  permissionChecker?: SetupAdminTableReactOptions['permissionChecker'];
} = {
  accessCodes: undefined,
  accessRoles: undefined,
  defaultGridOptions: {},
  initialized: false,
  locale: 'zh-CN',
  permissionChecker: undefined,
};
let preferenceUnsubscribe: null | (() => void) = null;
const preferencesStore = getDefaultPreferencesStore();

function applyLocale(locale: 'en-US' | 'zh-CN') {
  state.locale = locale;
  setTableLocale(locale);
  registerTableFormatters(createTableDateFormatter(state.locale));
}

function ensurePreferencesBinding() {
  if (preferenceUnsubscribe) {
    return;
  }
  preferenceUnsubscribe = preferencesStore.subscribe((preferences) => {
    applyLocale(normalizeTableLocale(preferences?.app?.locale));
  });
}

export function syncAdminTableReactWithPreferences() {
  const currentPreferences = preferencesStore.getPreferences();
  if (!currentPreferences) {
    return;
  }
  applyLocale(normalizeTableLocale(currentPreferences.app.locale));
}

export function setupAdminTableReact(options: SetupAdminTableReactOptions = {}) {
  setupAdminTableCore({ locale: options.locale });

  applyLocale(normalizeTableLocale(options.locale ?? state.locale));
  state.defaultGridOptions = {
    ...state.defaultGridOptions,
    ...(options.defaultGridOptions ?? {}),
  };
  state.accessCodes = options.accessCodes ?? state.accessCodes;
  state.accessRoles = options.accessRoles ?? state.accessRoles;
  state.permissionChecker = options.permissionChecker ?? state.permissionChecker;

  if (options.bindPreferences !== false) {
    ensurePreferencesBinding();
    syncAdminTableReactWithPreferences();
  }

  if (!state.initialized) {
    registerBuiltinReactRenderers();
    state.initialized = true;
  }
}

export function getAdminTableReactSetupState() {
  return state;
}
