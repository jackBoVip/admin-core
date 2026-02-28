import type { SetupAdminTableVueOptions } from './types';

import {
  createTableDateFormatter,
  normalizeTableLocale,
  setupAdminTableCore,
} from '@admin-core/table-core';
import {
  type Preferences,
} from '@admin-core/preferences';
import {
  applyTableLocaleCore,
  applyTableSetupPermissionState,
  createTablePreferencesBinder,
  resolveTableThemeContext,
} from '@admin-core/table-shared';
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
  VxeSwitch,
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
import { shallowRef } from 'vue';

import { registerBuiltinVueRenderers } from './renderers';

let initialized = false;
let formatterInitialized = false;
let currentFormatterLocale: 'en-US' | 'zh-CN' = 'zh-CN';
const themeSignal = shallowRef(0);
const setupState: {
  accessCodes?: SetupAdminTableVueOptions['accessCodes'];
  accessRoles?: SetupAdminTableVueOptions['accessRoles'];
  locale: 'en-US' | 'zh-CN';
  permissionChecker?: SetupAdminTableVueOptions['permissionChecker'];
  theme: {
    colorPrimary?: string;
  };
} = {
  accessCodes: undefined,
  accessRoles: undefined,
  locale: 'zh-CN',
  permissionChecker: undefined,
  theme: {},
};

const localeMap = {
  'en-US': enUS,
  'zh-CN': zhCN,
} as const;

function registerDefaultFormatters(locale: 'en-US' | 'zh-CN') {
  currentFormatterLocale = locale;

  if (formatterInitialized) {
    return;
  }

  VxeUI.formats.add('formatDate', {
    tableCellFormatMethod({ cellValue }) {
      return createTableDateFormatter(currentFormatterLocale).formatDate(cellValue);
    },
  });

  VxeUI.formats.add('formatDateTime', {
    tableCellFormatMethod({ cellValue }) {
      return createTableDateFormatter(currentFormatterLocale).formatDateTime(cellValue);
    },
  });

  formatterInitialized = true;
}

function applyLocale(locale: 'en-US' | 'zh-CN') {
  applyTableLocaleCore(locale, {
    onBeforeApply(nextLocale) {
      setupState.locale = nextLocale;
      registerDefaultFormatters(nextLocale);
    },
    onAfterApply(nextLocale) {
      VxeUI.setI18n(nextLocale, localeMap[nextLocale]);
      VxeUI.setLanguage(nextLocale);
    },
  });
}

function applyTheme(preferences: Preferences | null | undefined) {
  const resolvedTheme = resolveTableThemeContext(preferences);
  if (!resolvedTheme) {
    return;
  }
  setupState.theme = {
    colorPrimary: resolvedTheme.resolvedPrimary || undefined,
  };
  themeSignal.value += 1;
  (VxeUI as any).setTheme?.(resolvedTheme.actualMode === 'dark' ? 'dark' : 'light');
}

const preferencesBinder = createTablePreferencesBinder({
  applyLocale,
  applyTheme,
});

export function syncAdminTableVueWithPreferences() {
  preferencesBinder.syncWithPreferences();
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
  VxeUI.component(VxeSwitch);
  VxeUI.component(VxeTooltip);
  VxeUI.component(VxeUpload);

  registerBuiltinVueRenderers(VxeUI);
  initialized = true;
}

export function setupAdminTableVue(options: SetupAdminTableVueOptions = {}) {
  setupAdminTableCore({ locale: options.locale });
  initVxeTable();
  applyTableSetupPermissionState(setupState, options);

  const locale = normalizeTableLocale(options.locale);
  applyLocale(locale);

  if (options.bindPreferences !== false) {
    preferencesBinder.ensurePreferencesBinding();
    syncAdminTableVueWithPreferences();
  }

  if (options.setupThemeAndLocale) {
    options.setupThemeAndLocale(VxeUI);
  }

  options.configVxeTable?.(VxeUI);
}

export function getAdminTableVueSetupState() {
  return setupState;
}

export function getAdminTableVueThemeSignal() {
  return themeSignal;
}
