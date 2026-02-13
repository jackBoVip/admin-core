import type { SetupAdminTableVueOptions } from './types';

import { registerTableFormatters, setupAdminTableCore } from '@admin-core/table-core';
import {
  VxeButton,
  VxeCheckbox,
  VxeIcon,
  VxeInput,
  VxeLoading,
  VxeModal,
  VxeNumberInput,
  VxePager,
  VxeRadioGroup,
  VxeSelect,
  VxeTooltip,
  VxeUI,
  VxeUpload,
} from 'vxe-pc-ui';
import enUS from 'vxe-pc-ui/lib/language/en-US';
import zhCN from 'vxe-pc-ui/lib/language/zh-CN';
import {
  VxeColgroup,
  VxeColumn,
  VxeGrid,
  VxeTable,
  VxeToolbar,
} from 'vxe-table';

import { registerBuiltinVueRenderers } from './renderers';

let initialized = false;
let formatterInitialized = false;
let currentFormatterLocale: 'en-US' | 'zh-CN' = 'zh-CN';

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

function registerDefaultFormatters(locale: 'en-US' | 'zh-CN') {
  currentFormatterLocale = locale;
  registerTableFormatters(createFormatter(currentFormatterLocale));

  if (formatterInitialized) {
    return;
  }

  VxeUI.formats.add('formatDate', {
    tableCellFormatMethod({ cellValue }) {
      return createFormatter(currentFormatterLocale).formatDate(cellValue);
    },
  });

  VxeUI.formats.add('formatDateTime', {
    tableCellFormatMethod({ cellValue }) {
      return createFormatter(currentFormatterLocale).formatDateTime(cellValue);
    },
  });

  formatterInitialized = true;
}

function initVxeTable() {
  if (initialized) return;

  VxeUI.component(VxeTable);
  VxeUI.component(VxeColumn);
  VxeUI.component(VxeColgroup);
  VxeUI.component(VxeGrid);
  VxeUI.component(VxeToolbar);

  VxeUI.component(VxeButton);
  VxeUI.component(VxeCheckbox);
  VxeUI.component(VxeIcon);
  VxeUI.component(VxeInput);
  VxeUI.component(VxeLoading);
  VxeUI.component(VxeModal);
  VxeUI.component(VxeNumberInput);
  VxeUI.component(VxePager);
  VxeUI.component(VxeRadioGroup);
  VxeUI.component(VxeSelect);
  VxeUI.component(VxeTooltip);
  VxeUI.component(VxeUpload);

  registerBuiltinVueRenderers(VxeUI);
  initialized = true;
}

export function setupAdminTableVue(options: SetupAdminTableVueOptions = {}) {
  setupAdminTableCore({ locale: options.locale });
  initVxeTable();

  const localeMap = {
    'en-US': enUS,
    'zh-CN': zhCN,
  } as const;

  const locale = options.locale ?? 'zh-CN';
  registerDefaultFormatters(locale);
  VxeUI.setI18n(locale, localeMap[locale]);
  VxeUI.setLanguage(locale);

  if (options.setupThemeAndLocale) {
    options.setupThemeAndLocale(VxeUI);
  }

  options.configVxeTable?.(VxeUI);
}
