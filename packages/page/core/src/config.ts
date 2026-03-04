/**
 * Page Core 初始化入口。
 * @description 提供全局 setup 与 ensure 能力，用于注册语言和日志级别等基础运行参数。
 */
import { createSetupController } from '@admin-core/shared-core';
import { setLocale } from './locales';
import { setLoggerLevel } from './utils';
import type { SetupAdminPageCoreOptions } from './types';

/**
 * Page Core 全局 setup 控制器。
 * @description 负责应用 locale 与日志级别等全局运行参数。
 */
const setupController = createSetupController<SetupAdminPageCoreOptions>(
  (options) => {
    if (options.locale) {
      setLocale(options.locale);
    }
    if (options.logLevel) {
      setLoggerLevel(options.logLevel);
    }
  },
  {}
);

/**
 * 执行 Page Core 初始化。
 * @description 支持重复调用，后续调用会合并并覆盖已有配置。
 * @param options 初始化配置。
 * @returns 无返回值。
 */
export const setupAdminPageCore = setupController.setup;

/**
 * 确保 Page Core 至少完成一次初始化。
 * @returns 无返回值。
 */
export const ensurePageCoreSetup = setupController.ensure;
