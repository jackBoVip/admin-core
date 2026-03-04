/**
 * Page Core 配置类型定义。
 * @description 提供 page-core 初始化阶段可配置的全局参数结构。
 */

import type { SupportedLocale } from './locales';
import type { LoggerMode } from '@admin-core/shared-core';

/**
 * AdminPage Core 初始化配置。
 * @description 用于应用启动阶段设置 page-core 的全局语言与日志等级。
 */
export interface SetupAdminPageCoreOptions {
  /** 全局语言。 */
  locale?: SupportedLocale;
  /** 日志级别。 */
  logLevel?: LoggerMode;
}
