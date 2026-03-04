/**
 * Table Core 初始化入口。
 * @description 提供全局 setup 与 ensure 能力，用于注册语言和日志级别等基础运行参数。
 */
import { createSetupController } from '@admin-core/shared-core';
import { setLocale } from './locales';
import { setLoggerLevel } from './utils';
import type { SetupAdminTableCoreOptions } from './types';

/**
 * 表格核心初始化控制器。
 * @description 统一管理 setup 幂等执行与 ensure 兜底初始化流程。
 */
const setupController = createSetupController<SetupAdminTableCoreOptions>(
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
 * 执行表格核心初始化。
 * @description 支持重复调用，后续调用会增量覆盖已有配置。
 */
export const setupAdminTableCore = setupController.setup;

/**
 * 确保表格核心至少初始化一次。
 * @description 常用于创建 API 前的兜底初始化，避免运行时状态未就绪。
 */
export const ensureTableCoreSetup = setupController.ensure;
