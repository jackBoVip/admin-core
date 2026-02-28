import type { SetupAdminTableReactOptions } from './types';

import {
  normalizeTableLocale,
  setupAdminTableCore,
} from '@admin-core/table-core';
import {
  type Preferences,
} from '@admin-core/preferences';
import {
  applyTableLocaleCore,
  applyTableSetupPermissionState,
  createTablePreferencesBinder,
  resolveTableThemeContext,
} from '@admin-core/table-shared';

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

function applyLocale(locale: 'en-US' | 'zh-CN') {
  applyTableLocaleCore(locale, {
    onBeforeApply(nextLocale) {
      state.locale = nextLocale;
    },
  });
}

function applyTheme(preferences: Preferences | null | undefined) {
  const resolvedTheme = resolveTableThemeContext(preferences);
  if (!resolvedTheme) {
    return;
  }

  const theme = resolvedTheme.preferences.theme;
  state.theme = {
    colorPrimary: resolvedTheme.resolvedPrimary || undefined,
    fontScale: theme.fontScale,
    mode: resolvedTheme.actualMode,
    radius: theme.radius,
  };
}

const preferencesBinder = createTablePreferencesBinder({
  applyLocale,
  applyTheme,
});

export function syncAdminTableReactWithPreferences() {
  preferencesBinder.syncWithPreferences();
}

export function setupAdminTableReact(options: SetupAdminTableReactOptions = {}) {
  setupAdminTableCore({ locale: options.locale });

  applyLocale(normalizeTableLocale(options.locale ?? state.locale));
  state.defaultGridOptions = {
    ...state.defaultGridOptions,
    ...(options.defaultGridOptions ?? {}),
  };
  applyTableSetupPermissionState(state, options);

  if (options.bindPreferences !== false) {
    preferencesBinder.ensurePreferencesBinding();
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
