import type { SupportedLocale } from './locales';

export interface SetupAdminPageCoreOptions {
  locale?: SupportedLocale;
  logLevel?: 'error' | 'info' | 'silent' | 'warn';
}
