import type { SetupAdminTableVueOptions } from './types';

import {
  createTableDateFormatter,
  normalizeTableLocale,
  registerTableFormatters,
  setLocale as setTableLocale,
  setupAdminTableCore,
} from '@admin-core/table-core';
import {
  getActualThemeMode,
  getDefaultPreferencesStore,
  getThemePrimaryColor,
  oklchToHex,
  type Preferences,
} from '@admin-core/preferences';
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
let preferenceUnsubscribe: null | (() => void) = null;
const themeSignal = shallowRef(0);
const setupState: {
  accessCodes?: SetupAdminTableVueOptions['accessCodes'];
  accessRoles?: SetupAdminTableVueOptions['accessRoles'];
  permissionChecker?: SetupAdminTableVueOptions['permissionChecker'];
  theme: {
    colorPrimary?: string;
  };
} = {
  accessCodes: undefined,
  accessRoles: undefined,
  permissionChecker: undefined,
  theme: {},
};

const localeMap = {
  'en-US': enUS,
  'zh-CN': zhCN,
} as const;
const preferencesStore = getDefaultPreferencesStore();

function normalizeThemePrimaryColor(value: null | string | undefined) {
  const raw = value?.trim();
  if (!raw) {
    return '';
  }
  if (/^oklch\(/i.test(raw)) {
    return oklchToHex(raw);
  }
  return raw;
}

function registerDefaultFormatters(locale: 'en-US' | 'zh-CN') {
  currentFormatterLocale = locale;
  registerTableFormatters(createTableDateFormatter(currentFormatterLocale));

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
  setTableLocale(locale);
  registerDefaultFormatters(locale);
  VxeUI.setI18n(locale, localeMap[locale]);
  VxeUI.setLanguage(locale);
}

function applyTheme(preferences: Preferences | null | undefined) {
  if (!preferences) {
    return;
  }
  const actualMode = getActualThemeMode(preferences.theme.mode);
  const isDark = actualMode === 'dark';
  const themePrimary = preferences.theme.builtinType === 'custom'
    ? preferences.theme.colorPrimary
    : getThemePrimaryColor(preferences.theme.builtinType, isDark);
  const cssVarPrimary = typeof document !== 'undefined'
    ? getComputedStyle(document.documentElement)
        .getPropertyValue('--primary')
        .trim()
    : '';
  const resolvedPrimary = normalizeThemePrimaryColor(cssVarPrimary || themePrimary);
  setupState.theme = {
    colorPrimary: resolvedPrimary || undefined,
  };
  themeSignal.value += 1;
  (VxeUI as any).setTheme?.(actualMode === 'dark' ? 'dark' : 'light');
}

function ensurePreferencesBinding() {
  if (preferenceUnsubscribe) {
    return;
  }
  preferenceUnsubscribe = preferencesStore.subscribe((preferences) => {
    const nextLocale = normalizeTableLocale(preferences?.app?.locale);
    applyLocale(nextLocale);
    applyTheme(preferences);
  });
}

export function syncAdminTableVueWithPreferences() {
  const currentPreferences = preferencesStore.getPreferences();
  if (!currentPreferences) {
    return;
  }
  applyLocale(normalizeTableLocale(currentPreferences.app.locale));
  applyTheme(currentPreferences);
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
  setupState.accessCodes = options.accessCodes ?? setupState.accessCodes;
  setupState.accessRoles = options.accessRoles ?? setupState.accessRoles;
  setupState.permissionChecker = options.permissionChecker ?? setupState.permissionChecker;

  const locale = normalizeTableLocale(options.locale);
  applyLocale(locale);

  if (options.bindPreferences !== false) {
    ensurePreferencesBinding();
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
