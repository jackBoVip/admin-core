
import { createSetupController } from '@admin-core/shared-core';
import { setLocale } from './locales';
import { setLoggerLevel } from './utils/logger';
import { ensureBuiltinRules, registerFormRules } from './utils/rules';
import type { SetupAdminFormCoreOptions } from './types';

const setupController = createSetupController<SetupAdminFormCoreOptions>(
  (options) => {
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
  },
  {}
);

export const setupAdminFormCore = setupController.setup;

export const ensureCoreSetup = setupController.ensure;
