/**
 * form-shared 导出入口。
 * @description 汇总 form-core 能力与跨框架共享适配器注册能力。
 */
/** 导出 zod，便于上层在同一入口构建规则。 */
export { z } from '@admin-core/form-core';

/**
 * 导出 form-core 核心 API 与类型。
 * @description 提供构建表单 schema、规则与运行时 API 的基础能力。
 */
export {
  createRangeRule,
  createFormApi,
  resolveSearchFormDefaults,
  registerFormRules,
  setupAdminFormCore,
  type AdapterCapabilities,
  type AdminFormApi,
  type AdminFormCommonConfig,
  type AdminFormComponentType,
  type AdminFormDependencies,
  type AdminFormProps,
  type AdminFormSchema,
  type FieldMappingTime,
  type FormAdapterV1,
  type FormLayout,
  type FormRuleContext,
  type FormRuleValidator,
  type FormSchemaRuleType,
  type ResolvedComponentBinding,
  type SemanticFormComponentType,
} from '@admin-core/form-core';

/**
 * 导出跨框架共享的表单适配器运行时注册能力。
 * @description React/Vue 适配层均依赖该注册器实现组件映射管理。
 */
export * from './registry';
