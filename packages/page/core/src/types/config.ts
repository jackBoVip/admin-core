import type { SupportedLocale } from './locales';
import type { LoggerMode } from '@admin-core/shared-core';

export interface SetupAdminPageCoreOptions {
  locale?: SupportedLocale;
  logLevel?: LoggerMode;
}
