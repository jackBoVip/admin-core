import { createSetupController } from '@admin-core/shared-core';
import { setLocale } from './locales';
import { setLoggerLevel } from './utils';
import type { SetupAdminPageCoreOptions } from './types';

const setupController = createSetupController<SetupAdminPageCoreOptions>(
  (options) => {
    if (options.locale) {
      setLocale(options.locale);
    }
    if (options.logLevel) {
      setLoggerLevel(options.logLevel);
    }
  },
  {}
);

export const setupAdminPageCore = setupController.setup;

export const ensurePageCoreSetup = setupController.ensure;
