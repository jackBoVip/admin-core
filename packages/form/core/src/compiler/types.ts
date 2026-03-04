/**
 * Form Core 编译器类型定义。
 * @description 定义 schema 编译产物结构，供运行时缓存与渲染阶段复用。
 */
import type { AdminFormCommonConfig, AdminFormSchema } from '../types';

/**
 * 编译后的字段 schema。
 * @description 在原始字段配置基础上补充可缓存的预编译信息。
 */
export interface CompiledFieldSchema extends AdminFormSchema {
  /** 预编译后的表单项类名。 */
  compiledFormItemClass: string;
  /** 当前字段配置哈希。 */
  hashId: string;
}

/**
 * 编译后的表单 schema 聚合结果。
 * @description 供运行时渲染和依赖计算直接消费的结构化编译产物。
 */
export interface CompiledSchema {
  /** 编译后的公共配置。 */
  commonConfig: AdminFormCommonConfig;
  /** 字段依赖图（key 为字段名，value 为依赖字段列表）。 */
  dependencyGraph: Map<string, string[]>;
  /** 字段映射表。 */
  fieldMap: Map<string, CompiledFieldSchema>;
  /** 扁平字段列表。 */
  fields: CompiledFieldSchema[];
  /** 表单结构整体哈希。 */
  hash: string;
}
