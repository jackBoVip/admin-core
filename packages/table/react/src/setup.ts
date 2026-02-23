import type { SetupAdminTableReactOptions } from './types';

import {
  createTableDateFormatter,
  normalizeTableLocale,
  registerTableFormatters,
  setLocale as setTableLocale,
  setupAdminTableCore,
} from '@admin-core/table-core';
import {
  getActualThemeMode,
  getDefaultPreferencesStore,
  type Preferences,
} from '@admin-core/preferences';

import { registerBuiltinReactRenderers } from './renderers';

const state: {
  accessCodes?: SetupAdminTableReactOptions['accessCodes'];
  accessRoles?: SetupAdminTableReactOptions['accessRoles'];
  defaultGridOptions: Record<string, any>;
  initialized: boolean;
  locale: 'en-US' | 'zh-CN';
  permissionChecker?: SetupAdminTableReactOptions['permissionChecker'];
  theme: {
    colorPrimary?: string;
    fontScale?: number;
    mode?: 'dark' | 'light';
    radius?: string;
  };
} = {
  accessCodes: undefined,
  accessRoles: undefined,
  defaultGridOptions: {},
  initialized: false,
  locale: 'zh-CN',
  permissionChecker: undefined,
  theme: {},
};
let preferenceUnsubscribe: null | (() => void) = null;
const preferencesStore = getDefaultPreferencesStore();

function applyLocale(locale: 'en-US' | 'zh-CN') {
  state.locale = locale;
  setTableLocale(locale);
  registerTableFormatters(createTableDateFormatter(state.locale));
}

function applyTheme(preferences: Preferences | null | undefined) {
  if (!preferences) {
    return;
  }
  const theme = preferences.theme;
  state.theme = {
    colorPrimary: theme.colorPrimary,
    fontScale: theme.fontScale,
    mode: getActualThemeMode(theme.mode),
    radius: theme.radius,
  };
}

function ensurePreferencesBinding() {
  if (preferenceUnsubscribe) {
    return;
  }
  preferenceUnsubscribe = preferencesStore.subscribe((preferences) => {
    applyLocale(normalizeTableLocale(preferences?.app?.locale));
    applyTheme(preferences);
  });
}

export function syncAdminTableReactWithPreferences() {
  const currentPreferences = preferencesStore.getPreferences();
  if (!currentPreferences) {
    return;
  }
  applyLocale(normalizeTableLocale(currentPreferences.app.locale));
  applyTheme(currentPreferences);
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
