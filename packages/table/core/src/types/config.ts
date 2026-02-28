import type { SupportedLocale } from './locales';
import type { LoggerMode } from '@admin-core/shared-core';

export interface SetupAdminTableCoreOptions {
  locale?: SupportedLocale;
  logLevel?: LoggerMode;
}
