
import { enUS } from './en-US';
import { zhCN } from './zh-CN';
import type { SupportedLocale, TableLocaleMessages } from '../types';

const localeMap: Record<SupportedLocale, TableLocaleMessages> = {
  'en-US': enUS,
  'zh-CN': zhCN,
};

let currentLocale: SupportedLocale = 'zh-CN';

export function getLocaleMessages() {
  return localeMap[currentLocale];
}

export function getLocale() {
  return currentLocale;
}

export function setLocale(locale: SupportedLocale) {
  currentLocale = locale;
}

export const supportedLocales = Object.keys(localeMap) as SupportedLocale[];

export { enUS, zhCN };
