import {
  normalizePageLocale,
  setupAdminPageCore,
} from '@admin-core/page-core';
import { setupAdminFormVue } from '@admin-core/form-vue';
import { setupAdminTableVue } from '@admin-core/table-vue';

import type { SetupAdminPageVueOptions } from './types';

const setupState: {
  initialized: boolean;
  locale: 'en-US' | 'zh-CN';
} = {
  initialized: false,
  locale: 'zh-CN',
};

export function setupAdminPageVue(options: SetupAdminPageVueOptions = {}) {
  setupAdminPageCore({
    locale: options.locale,
    logLevel: options.logLevel,
  });

  if (options.form !== false) {
    setupAdminFormVue(options.form ?? {});
  }

  if (options.table !== false) {
    setupAdminTableVue({
      ...(options.table ?? {}),
      locale: options.table?.locale ?? normalizePageLocale(options.locale),
    });
  }

  setupState.locale = normalizePageLocale(options.locale);
  setupState.initialized = true;
}

export function getAdminPageVueSetupState() {
  return setupState;
}
