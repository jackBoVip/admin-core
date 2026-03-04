/**
 * Form Core schema 编译器实现。
 * @description 提供字段 schema 预编译、哈希缓存与依赖图构建能力。
 */
import { isFunction } from '../utils/guards';
import { createHash } from '../utils/hash';
import type { AdminFormCommonConfig, AdminFormSchema } from '../types';
import type { CompiledFieldSchema, CompiledSchema } from './types';

/** 表单结构哈希缓存最大容量默认值。 */
const DEFAULT_CACHE_MAX_SIZE = 300;
/** 基于哈希键的 schema 编译缓存。 */
const compileCache = new Map<string, CompiledSchema>();
/** 基于 schema 引用与 commonConfig 引用的二级缓存。 */
let compileRefCache = new WeakMap<
  AdminFormSchema[],
  WeakMap<AdminFormCommonConfig, CompiledSchema>
>();
/** 当前缓存容量上限。 */
let cacheMaxSize = DEFAULT_CACHE_MAX_SIZE;
/** 空公共配置常量引用。 */
const EMPTY_COMMON_CONFIG = {} as AdminFormCommonConfig;

/** 缓存命中统计。 */
const cacheStats = {
  evictions: 0,
  hits: 0,
  misses: 0,
};

/**
 * Schema 编译缓存配置。
 * @description 控制编译缓存容量，平衡重复编译性能与内存占用。
 */
export interface ConfigureSchemaCompileCacheOptions {
  /** 缓存最大容量（条数），需为大于 0 的数字。 */
  maxSize?: number;
}

/**
 * Schema 编译缓存统计信息。
 * @description 用于观测缓存命中效果与淘汰行为，辅助性能调优。
 */
export interface SchemaCompileCacheStats {
  /** 缓存命中次数。 */
  hits: number;
  /** 缓存未命中次数。 */
  misses: number;
  /** 因容量限制触发淘汰的次数。 */
  evictions: number;
  /** 当前配置的最大容量。 */
  maxSize: number;
  /** 当前缓存条目数量。 */
  size: number;
}

/**
 * 裁剪编译缓存，保证不超过最大容量。
 */
function trimCompileCache() {
  while (compileCache.size > cacheMaxSize) {
    const oldestKey = compileCache.keys().next().value as string | undefined;
    if (!oldestKey) break;
    compileCache.delete(oldestKey);
    cacheStats.evictions += 1;
  }
}

/**
 * 规范化表单项类名配置。
 * @param formItemClass 类名字符串或类名函数。
 * @returns 最终类名字符串。
 */
function normalizeFormItemClass(formItemClass: (() => string) | string | undefined) {
  if (isFunction(formItemClass)) {
    try {
      return formItemClass();
    } catch {
      return '';
    }
  }
  return formItemClass ?? '';
}

/**
 * 计算 schema 与公共配置的哈希。
 * @param schema 表单字段 schema。
 * @param commonConfig 公共配置。
 * @returns 用于缓存命中的哈希值。
 */
function createSchemaHash(schema: AdminFormSchema[], commonConfig: AdminFormCommonConfig) {
  const parts: unknown[] = [commonConfig];
  for (const item of schema) {
    parts.push(
      item.fieldName,
      item.component,
      item.label,
      item.rules,
      item.dependencies,
      item.defaultValue,
      item.componentProps,
      item.hide,
      item.formItemClass,
      item.wrapperClass
    );
  }
  return createHash(parts);
}

/**
 * 清空 schema 编译缓存与统计信息。
 * @returns 无返回值。
 */
export function clearSchemaCompileCache() {
  compileCache.clear();
  compileRefCache = new WeakMap<
    AdminFormSchema[],
    WeakMap<AdminFormCommonConfig, CompiledSchema>
  >();
  cacheStats.hits = 0;
  cacheStats.misses = 0;
  cacheStats.evictions = 0;
}

/**
 * 配置 schema 编译缓存参数。
 * @param options 缓存选项。
 * @returns 无返回值。
 */
export function configureSchemaCompileCache(options: ConfigureSchemaCompileCacheOptions = {}) {
  if (typeof options.maxSize === 'number' && options.maxSize > 0) {
    cacheMaxSize = Math.floor(options.maxSize);
    trimCompileCache();
  }
}

/**
 * 获取 schema 编译缓存统计信息。
 * @returns 当前缓存规模、容量与命中统计。
 */
export function getSchemaCompileCacheStats(): SchemaCompileCacheStats {
  return {
    ...cacheStats,
    maxSize: cacheMaxSize,
    size: compileCache.size,
  };
}

/**
 * 编译表单 schema，构建字段映射与依赖图并写入缓存。
 * @param schema 字段 schema。
 * @param commonConfig 公共配置。
 * @returns 编译后的 schema 结果。
 */
export function compileSchema(
  schema: AdminFormSchema[] = [],
  commonConfig: AdminFormCommonConfig = EMPTY_COMMON_CONFIG
): CompiledSchema {
  const normalizedCommonConfig = commonConfig ?? EMPTY_COMMON_CONFIG;
  const referencedSchema = schema;
  const refMap = compileRefCache.get(referencedSchema);
  const refCached = refMap?.get(normalizedCommonConfig);
  if (refCached) {
    cacheStats.hits += 1;
    return refCached;
  }

  const hash = createSchemaHash(schema, normalizedCommonConfig);
  const cached = compileCache.get(hash);
  if (cached) {
    cacheStats.hits += 1;
    /* LRU: move to the latest position. */
    compileCache.delete(hash);
    compileCache.set(hash, cached);
    const cachedRefMap = compileRefCache.get(referencedSchema);
    if (!cachedRefMap) {
      compileRefCache.set(
        referencedSchema,
        new WeakMap([[normalizedCommonConfig, cached]])
      );
    } else {
      cachedRefMap.set(normalizedCommonConfig, cached);
    }
    return cached;
  }
  cacheStats.misses += 1;

  const fields: CompiledFieldSchema[] = [];
  const fieldMap = new Map<string, CompiledFieldSchema>();
  const dependencyGraph = new Map<string, string[]>();

  for (const item of schema) {
    if (!item.fieldName) {
      continue;
    }

    const compiledItem: CompiledFieldSchema = {
      ...item,
      compiledFormItemClass: normalizeFormItemClass(item.formItemClass),
      hashId: createHash([item.fieldName, item.component, item.dependencies, item.rules]),
    };

    fields.push(compiledItem);
    fieldMap.set(item.fieldName, compiledItem);

    const triggers = item.dependencies?.triggerFields ?? [];
    for (const triggerField of triggers) {
      const current = dependencyGraph.get(triggerField) ?? [];
      current.push(item.fieldName);
      dependencyGraph.set(triggerField, current);
    }
  }

  const compiled: CompiledSchema = {
    hash,
    fields,
    fieldMap,
    dependencyGraph,
    commonConfig: normalizedCommonConfig,
  };

  compileCache.set(hash, compiled);
  if (!refMap) {
    compileRefCache.set(referencedSchema, new WeakMap([[normalizedCommonConfig, compiled]]));
  } else {
    refMap.set(normalizedCommonConfig, compiled);
  }
  trimCompileCache();
  return compiled;
}
