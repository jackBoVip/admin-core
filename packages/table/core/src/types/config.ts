/**
 * Table Core 初始化配置类型定义。
 * @description 描述 table-core setup 阶段可配置的全局参数结构。
 */
import type { SupportedLocale } from './locales';
import type { LoggerMode } from '@admin-core/shared-core';

/**
 * 表格核心初始化配置。
 * @description 用于在应用启动阶段设置 table-core 的全局行为。
 */
export interface SetupAdminTableCoreOptions {
  /** 默认语言。 */
  locale?: SupportedLocale;
  /** 日志级别。 */
  logLevel?: LoggerMode;
}
