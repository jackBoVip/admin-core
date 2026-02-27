import { enUS } from './en-US';
import { zhCN } from './zh-CN';
import type {
  BuiltInSupportedLocale,
  PageLocaleMessageInput,
  PageLocaleMessages,
  SupportedLocale,
} from '../types';

const BUILTIN_LOCALES = {
  'en-US': enUS,
  'zh-CN': zhCN,
} as const satisfies Record<BuiltInSupportedLocale, PageLocaleMessages>;

const localeMap = new Map<string, PageLocaleMessages>(
  Object.entries(BUILTIN_LOCALES)
);

let currentLocale: SupportedLocale = 'zh-CN';
let localeVersion = 0;
const localeListeners = new Set<() => void>();
export const supportedLocales: string[] = Array.from(localeMap.keys());

function syncSupportedLocales() {
  supportedLocales.splice(0, supportedLocales.length, ...localeMap.keys());
}

function normalizeLocale(locale?: null | string) {
  return String(locale ?? '').trim();
}

function resolveByLanguage(locale: string) {
  const [language] = locale.split(/[-_]/);
  if (!language) {
    return null;
  }
  for (const [key, messages] of localeMap) {
    if (key.toLowerCase().startsWith(`${language.toLowerCase()}-`)) {
      return messages;
    }
  }
  return null;
}

function resolveLocaleMessages(locale: string): PageLocaleMessages {
  const normalized = normalizeLocale(locale);
  const exact = localeMap.get(normalized);
  if (exact) {
    return exact;
  }
  for (const [key, messages] of localeMap) {
    if (key.toLowerCase() === normalized.toLowerCase()) {
      return messages;
    }
  }
  const byLanguage = resolveByLanguage(normalized);
  if (byLanguage) {
    return byLanguage;
  }
  return localeMap.get('zh-CN') ?? zhCN;
}

function mergeLocaleMessages(
  base: PageLocaleMessages,
  patch: PageLocaleMessageInput
): PageLocaleMessages {
  return {
    page: {
      ...base.page,
      ...(patch.page ?? {}),
    },
  };
}

function notifyLocaleChange() {
  localeVersion += 1;
  localeListeners.forEach((listener) => {
    listener();
  });
}

export function getLocaleMessages(locale?: SupportedLocale) {
  return resolveLocaleMessages(locale ?? currentLocale);
}

export function getLocale() {
  return currentLocale;
}

export function setLocale(locale: SupportedLocale) {
  const normalized = normalizeLocale(locale);
  if (!normalized || currentLocale === normalized) {
    return;
  }
  currentLocale = normalized;
  notifyLocaleChange();
}

export function normalizePageLocale(
  locale?: null | string,
  fallback: BuiltInSupportedLocale = 'zh-CN'
): BuiltInSupportedLocale {
  const normalized = normalizeLocale(locale);
  if (!normalized) {
    return fallback;
  }
  if (normalized.toLowerCase().startsWith('en')) {
    return 'en-US';
  }
  if (normalized.toLowerCase().startsWith('zh')) {
    return 'zh-CN';
  }
  return fallback;
}

export function registerPageLocaleMessages(
  locale: SupportedLocale,
  messages: PageLocaleMessageInput,
  options: { replace?: boolean } = {}
) {
  const key = normalizeLocale(locale);
  if (!key) {
    return;
  }

  const base = options.replace
    ? resolveLocaleMessages(normalizePageLocale(key))
    : resolveLocaleMessages(key);

  localeMap.set(key, mergeLocaleMessages(base, messages));
  syncSupportedLocales();
  notifyLocaleChange();
}

export function getLocaleVersion() {
  return localeVersion;
}

export function subscribeLocaleChange(listener: () => void) {
  localeListeners.add(listener);
  return () => {
    localeListeners.delete(listener);
  };
}

export { enUS, zhCN };
