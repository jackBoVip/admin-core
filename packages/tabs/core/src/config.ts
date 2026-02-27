import type {
  AdminTabsLocale,
  SetupAdminTabsCoreOptions,
} from './types';

const DEFAULT_LOCALE: AdminTabsLocale = {
  close: 'Close',
};

interface AdminTabsCoreSetupState {
  initialized: boolean;
  locale: AdminTabsLocale;
  localeVersion: number;
}

const setupState: AdminTabsCoreSetupState = {
  initialized: false,
  locale: { ...DEFAULT_LOCALE },
  localeVersion: 0,
};

const localeListeners = new Set<() => void>();

function notifyLocaleChanged() {
  setupState.localeVersion += 1;
  for (const listener of localeListeners) {
    listener();
  }
}

export function setupAdminTabsCore(options: SetupAdminTabsCoreOptions = {}) {
  if (options.locale) {
    setupState.locale = {
      ...setupState.locale,
      ...options.locale,
    };
    notifyLocaleChanged();
  }
  setupState.initialized = true;
  return setupState;
}

export function setAdminTabsLocale(locale: Partial<AdminTabsLocale>) {
  setupState.locale = {
    ...setupState.locale,
    ...locale,
  };
  notifyLocaleChanged();
  return setupState.locale;
}

export function getAdminTabsLocale() {
  return setupState.locale;
}

export function getAdminTabsLocaleVersion() {
  return setupState.localeVersion;
}

export function subscribeAdminTabsLocale(listener: () => void) {
  localeListeners.add(listener);
  return () => {
    localeListeners.delete(listener);
  };
}

export function getAdminTabsCoreSetupState() {
  return setupState;
}
