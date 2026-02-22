import { enUS } from './en-US';
import { zhCN } from './zh-CN';
import type { AdminFormLocaleMessages, LocaleMessageInput } from './types';

export type BuiltInSupportedLocale = 'en-US' | 'zh-CN';
export type SupportedLocale = BuiltInSupportedLocale | (string & {});

const BUILTIN_LOCALES = {
  'en-US': enUS,
  'zh-CN': zhCN,
} as Record<BuiltInSupportedLocale, AdminFormLocaleMessages>;

const localeMessagesMap = new Map<string, AdminFormLocaleMessages>(
  Object.entries(BUILTIN_LOCALES)
);

let currentLocale: SupportedLocale = 'zh-CN';
let localeVersion = 0;
const localeChangeListeners = new Set<() => void>();

export const supportedLocales: string[] = Array.from(localeMessagesMap.keys());

function syncSupportedLocales() {
  supportedLocales.splice(0, supportedLocales.length, ...localeMessagesMap.keys());
}

function notifyLocaleChange() {
  localeVersion += 1;
  for (const listener of localeChangeListeners) {
    listener();
  }
}

function normalizeLocale(locale: string) {
  return String(locale || '').trim();
}

function resolveByLanguage(locale: string) {
  const [language] = locale.split(/[-_]/);
  if (!language) return null;
  for (const [key, messages] of localeMessagesMap) {
    if (key.toLowerCase().startsWith(`${language.toLowerCase()}-`)) {
      return messages;
    }
  }
  return null;
}

function resolveLocaleMessages(locale: string): AdminFormLocaleMessages {
  const normalized = normalizeLocale(locale);
  const exact = localeMessagesMap.get(normalized);
  if (exact) {
    return exact;
  }
  for (const [key, messages] of localeMessagesMap) {
    if (key.toLowerCase() === normalized.toLowerCase()) {
      return messages;
    }
  }
  const byLanguage = resolveByLanguage(normalized);
  if (byLanguage) {
    return byLanguage;
  }
  return localeMessagesMap.get('zh-CN') || zhCN;
}

function mergeLocaleMessages(
  base: AdminFormLocaleMessages,
  patch: LocaleMessageInput
): AdminFormLocaleMessages {
  return {
    form: {
      ...base.form,
      ...(patch.form ?? {}),
    },
    submitPage: {
      ...base.submitPage,
      ...(patch.submitPage ?? {}),
    },
  };
}

export function getLocaleMessages(locale?: SupportedLocale) {
  const target = locale ?? currentLocale;
  return resolveLocaleMessages(target);
}

export function setLocale(locale: SupportedLocale) {
  const normalized = normalizeLocale(locale);
  if (!normalized || normalized === currentLocale) {
    return;
  }
  currentLocale = normalized;
  notifyLocaleChange();
}

export function registerLocaleMessages(
  locale: SupportedLocale,
  messages: LocaleMessageInput,
  options: { replace?: boolean } = {}
) {
  const key = normalizeLocale(locale);
  if (!key) return;
  const current = options.replace
    ? resolveByLanguage(key) || resolveLocaleMessages('zh-CN')
    : resolveLocaleMessages(key);
  const merged = mergeLocaleMessages(current, messages);
  localeMessagesMap.set(key, merged);
  syncSupportedLocales();
  notifyLocaleChange();
}

export function getCurrentLocale(): SupportedLocale {
  return currentLocale;
}

export function getLocaleVersion() {
  return localeVersion;
}

export function subscribeLocaleChange(listener: () => void) {
  localeChangeListeners.add(listener);
  return () => {
    localeChangeListeners.delete(listener);
  };
}

export function formatLocaleMessage(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? '');
}

export { enUS, zhCN };
export type { AdminFormLocaleMessages, LocaleMessageInput };
