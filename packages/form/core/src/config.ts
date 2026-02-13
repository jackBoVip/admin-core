
import { setLocale } from './locales';
import { setLoggerLevel } from './utils/logger';
import { ensureBuiltinRules, registerFormRules } from './utils/rules';
import type { SetupAdminFormCoreOptions } from './types';

let initialized = false;

export function setupAdminFormCore(options: SetupAdminFormCoreOptions = {}) {
  if (options.locale) {
    setLocale(options.locale);
  }
  if (options.logLevel) {
    setLoggerLevel(options.logLevel);
  }
  ensureBuiltinRules();
  if (options.rules) {
    registerFormRules(options.rules);
  }
  initialized = true;
}

export function ensureCoreSetup() {
  if (initialized) return;
  setupAdminFormCore();
}
