import {
  getActualThemeMode,
  getDefaultPreferencesStore,
  getThemePrimaryColor,
  oklchToHex,
  type Preferences,
} from '@admin-core/preferences';
import {
  createTableDateFormatter,
  normalizeTableLocale,
  registerTableFormatters,
  setLocale as setTableLocale,
} from '@admin-core/table-core';
import type { BuiltInTableLocale } from './types';

export function normalizeThemePrimaryColor(value: null | string | undefined) {
  const raw = value?.trim();
  if (!raw) {
    return '';
  }
  if (/^oklch\(/i.test(raw)) {
    return oklchToHex(raw);
  }
  return raw;
}

export interface TablePreferencesBinderOptions {
  applyLocale: (locale: BuiltInTableLocale) => void;
  applyTheme: (preferences: Preferences | null | undefined) => void;
}

export function createTablePreferencesBinder(
  options: TablePreferencesBinderOptions
) {
  let preferenceUnsubscribe: null | (() => void) = null;
  const preferencesStore = getDefaultPreferencesStore();

  function ensurePreferencesBinding() {
    if (preferenceUnsubscribe) {
      return;
    }
    preferenceUnsubscribe = preferencesStore.subscribe((preferences) => {
      const nextLocale = normalizeTableLocale(preferences?.app?.locale);
      options.applyLocale(nextLocale);
      options.applyTheme(preferences);
    });
  }

  function syncWithPreferences() {
    const currentPreferences = preferencesStore.getPreferences();
    if (!currentPreferences) {
      return;
    }
    options.applyLocale(normalizeTableLocale(currentPreferences.app.locale));
    options.applyTheme(currentPreferences);
  }

  return {
    ensurePreferencesBinding,
    syncWithPreferences,
  };
}

export interface ApplyTableLocaleCoreHooks {
  onAfterApply?: (locale: BuiltInTableLocale) => void;
  onBeforeApply?: (locale: BuiltInTableLocale) => void;
}

export function applyTableLocaleCore(
  locale: BuiltInTableLocale,
  hooks: ApplyTableLocaleCoreHooks = {}
) {
  hooks.onBeforeApply?.(locale);
  setTableLocale(locale);
  registerTableFormatters(createTableDateFormatter(locale));
  hooks.onAfterApply?.(locale);
}

export interface ResolvedTableThemeContext {
  actualMode: 'dark' | 'light';
  preferences: Preferences;
  resolvedPrimary: string;
}

export function resolveTableThemeContext(
  preferences: Preferences | null | undefined
): null | ResolvedTableThemeContext {
  if (!preferences) {
    return null;
  }

  const actualMode = getActualThemeMode(preferences.theme.mode);
  const isDark = actualMode === 'dark';
  const themePrimary = preferences.theme.builtinType === 'custom'
    ? preferences.theme.colorPrimary
    : getThemePrimaryColor(preferences.theme.builtinType, isDark);
  const cssVarPrimary = typeof document !== 'undefined'
    ? getComputedStyle(document.documentElement)
        .getPropertyValue('--primary')
        .trim()
    : '';

  return {
    actualMode,
    preferences,
    resolvedPrimary: normalizeThemePrimaryColor(cssVarPrimary || themePrimary),
  };
}
