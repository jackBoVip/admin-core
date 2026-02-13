import type { SupportedLocale } from './locales';

export interface SetupAdminTableCoreOptions {
  locale?: SupportedLocale;
  logLevel?: 'error' | 'info' | 'silent' | 'warn';
}
