import {
  normalizePageLocale,
  setupAdminPageCore,
} from '@admin-core/page-core';
import { setupAdminFormReact } from '@admin-core/form-react';
import { setupAdminTableReact } from '@admin-core/table-react';

import type { SetupAdminPageReactOptions } from './types';

const setupState: {
  initialized: boolean;
  locale: 'en-US' | 'zh-CN';
} = {
  initialized: false,
  locale: 'zh-CN',
};

export function setupAdminPageReact(options: SetupAdminPageReactOptions = {}) {
  setupAdminPageCore({
    locale: options.locale,
    logLevel: options.logLevel,
  });

  if (options.form !== false) {
    setupAdminFormReact(options.form ?? {});
  }

  if (options.table !== false) {
    setupAdminTableReact({
      ...(options.table ?? {}),
      locale: options.table?.locale ?? normalizePageLocale(options.locale),
    });
  }

  setupState.locale = normalizePageLocale(options.locale);
  setupState.initialized = true;
}

export function getAdminPageReactSetupState() {
  return setupState;
}
