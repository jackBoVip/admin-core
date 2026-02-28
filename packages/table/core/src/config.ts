
import { createSetupController } from '@admin-core/shared-core';
import { setLocale } from './locales';
import { setLoggerLevel } from './utils';
import type { SetupAdminTableCoreOptions } from './types';

const setupController = createSetupController<SetupAdminTableCoreOptions>(
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

export const setupAdminTableCore = setupController.setup;

export const ensureTableCoreSetup = setupController.ensure;
