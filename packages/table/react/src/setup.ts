import type { SetupAdminTableReactOptions } from './types';

import { registerTableFormatters, setupAdminTableCore } from '@admin-core/table-core';

import { registerBuiltinReactRenderers } from './renderers';

const state: {
  defaultGridOptions: Record<string, any>;
  initialized: boolean;
  locale: 'en-US' | 'zh-CN';
} = {
  defaultGridOptions: {},
  initialized: false,
  locale: 'zh-CN',
};

function createFormatter(dateLocale: 'en-US' | 'zh-CN') {
  return {
    formatDate(value: any) {
      if (value === undefined || value === null || value === '') return '';
      const date = new Date(value);
      return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleDateString(dateLocale);
    },
    formatDateTime(value: any) {
      if (value === undefined || value === null || value === '') return '';
      const date = new Date(value);
      return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleString(dateLocale);
    },
  };
}

export function setupAdminTableReact(options: SetupAdminTableReactOptions = {}) {
  setupAdminTableCore({ locale: options.locale });

  state.locale = options.locale ?? state.locale;
  state.defaultGridOptions = {
    ...state.defaultGridOptions,
    ...(options.defaultGridOptions ?? {}),
  };
  registerTableFormatters(createFormatter(state.locale));

  if (!state.initialized) {
    registerBuiltinReactRenderers();
    state.initialized = true;
  }
}

export function getAdminTableReactSetupState() {
  return state;
}
