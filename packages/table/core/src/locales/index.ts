
import { enUS } from './en-US';
import { zhCN } from './zh-CN';
import type { SupportedLocale, TableLocaleMessages } from '../types';

const localeMap: Record<SupportedLocale, TableLocaleMessages> = {
  'en-US': enUS,
  'zh-CN': zhCN,
};

let currentLocale: SupportedLocale = 'zh-CN';
let localeVersion = 0;
const localeListeners = new Set<() => void>();

function notifyLocaleChange() {
  localeVersion += 1;
  localeListeners.forEach((listener) => {
    listener();
  });
}

export function getLocaleMessages() {
  return localeMap[currentLocale];
}

export function getLocale() {
  return currentLocale;
}

export function setLocale(locale: SupportedLocale) {
  if (currentLocale === locale) {
    return;
  }
  currentLocale = locale;
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

export const supportedLocales = Object.keys(localeMap) as SupportedLocale[];

export { enUS, zhCN };
