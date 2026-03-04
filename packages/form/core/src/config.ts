/**
 * Form Core 初始化入口。
 * @description 负责语言、日志、内置规则与外部规则注册等核心启动流程。
 */
import { createSetupController } from '@admin-core/shared-core';
import { setLocale } from './locales';
import { setLoggerLevel } from './utils/logger';
import { ensureBuiltinRules, registerFormRules } from './utils/rules';
import type { SetupAdminFormCoreOptions } from './types';

/** 表单核心初始化控制器。 */
const setupController = createSetupController<SetupAdminFormCoreOptions>(
  (options) => {
    if (options.locale) {
      setLocale(options.locale);
    }
    if (options.logLevel) {
      setLoggerLevel(options.logLevel);
    }
    ensureBuiltinRules();
    if (options.rules) {
      registerFormRules(options.rules);
    }
  },
  {}
);

/** 表单核心初始化入口（`setupController.setup` 别名导出）。 */
export const setupAdminFormCore = setupController.setup;

/** 确保表单核心已完成初始化（`setupController.ensure` 别名导出）。 */
export const ensureCoreSetup = setupController.ensure;
