import { setLocale } from './locales';
import { setLoggerLevel } from './utils';
import type { SetupAdminPageCoreOptions } from './types';

let initialized = false;

export function setupAdminPageCore(options: SetupAdminPageCoreOptions = {}) {
  if (options.locale) {
    setLocale(options.locale);
  }
  if (options.logLevel) {
    setLoggerLevel(options.logLevel);
  }
  initialized = true;
}

export function ensurePageCoreSetup() {
  if (initialized) {
    return;
  }
  setupAdminPageCore();
}
