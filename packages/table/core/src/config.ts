
import { setLocale } from './locales';
import { setLoggerLevel } from './utils';
import type { SetupAdminTableCoreOptions } from './types';

let initialized = false;

export function setupAdminTableCore(options: SetupAdminTableCoreOptions = {}) {
  if (options.locale) {
    setLocale(options.locale);
  }
  if (options.logLevel) {
    setLoggerLevel(options.logLevel);
  }
  initialized = true;
}

export function ensureTableCoreSetup() {
  if (initialized) return;
  setupAdminTableCore();
}
