import { enUS } from './en-US';
import { zhCN } from './zh-CN';

export type SupportedLocale = 'en-US' | 'zh-CN';

const localeMessages = {
  'en-US': enUS,
  'zh-CN': zhCN,
} as const;

let currentLocale: SupportedLocale = 'zh-CN';

export const supportedLocales: SupportedLocale[] = ['zh-CN', 'en-US'];

export function getLocaleMessages(locale?: SupportedLocale) {
  const target = locale ?? currentLocale;
  return localeMessages[target];
}

export function setLocale(locale: SupportedLocale) {
  currentLocale = locale;
}

export function getCurrentLocale(): SupportedLocale {
  return currentLocale;
}

export function formatLocaleMessage(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? '');
}

export { enUS, zhCN };
